import { isEqual, keyBy, sortBy } from 'lodash-es';
import {
  makeAutoObservable,
  onBecomeObserved,
  onBecomeUnobserved,
  runInAction,
} from 'mobx';

import {
  Client,
  Engine,
  EngineSize,
  SdkError,
} from '@relationalai/rai-sdk-javascript/web';

// See: https://github.com/RelationalAI/engine-operator/blob/main/api/v1beta1/engine_types.go#L116
// EngineState in the SDK should be removed
export const EngineState = {
  REQUESTED: 'REQUESTED',
  UPDATING: 'UPDATING',
  PROVISIONING: 'PROVISIONING',
  PROVISIONED: 'PROVISIONED',
  PROVISION_FAILED: 'PROVISION_FAILED',
  DELETING: 'DELETING',
  SUSPENDED: 'SUSPENDED',
  DEPROVISIONING: 'DEPROVISIONING',
  UNKNOWN: 'UNKNOWN',
};

const activeStates = {
  state: [
    EngineState.PROVISIONED,
    EngineState.PROVISION_FAILED,
    EngineState.PROVISIONING,
    EngineState.REQUESTED,
    EngineState.DELETING,
    EngineState.SUSPENDED,
    EngineState.UPDATING,
    EngineState.DEPROVISIONING,
  ],
};

export const DELETABLE_STATES = [
  EngineState.PROVISIONED,
  EngineState.PROVISION_FAILED,
  EngineState.SUSPENDED,
];

export const STORAGE_KEY = 'engineStore';

type StoredState = {
  selectedEngines: { [accountId: string]: string };
};

type PendingEngine = {
  // we'll display pendingEngine
  pendingEngine: Engine;
  // until listEngine returns engine
  // that is not the same as staleEngine
  staleEngine?: Engine;
};

export class EngineStore {
  selectedEngine = '';
  engines: Engine[] = [];
  isLoading = false;
  isLoaded = false;
  error?: SdkError = undefined;

  private isObserved = false;
  private client: Client;
  private accountId: string;
  private pollInterval: number;
  private pendingEngines: PendingEngine[] = [];

  constructor(accountId: string, client: Client, pollInterval = 5000) {
    this.accountId = accountId;
    this.client = client;
    this.pollInterval = pollInterval;

    const state = this.readState();

    if (state.selectedEngines[this.accountId]) {
      this.selectedEngine = state.selectedEngines[this.accountId];
    }

    makeAutoObservable<EngineStore, 'client'>(this, { client: false });

    onBecomeObserved(this, 'engines', () => this.resume());
    onBecomeUnobserved(this, 'engines', () => this.suspend());
  }

  private resume() {
    this.isObserved = true;
    this.loadEngines();
  }

  private suspend() {
    this.isObserved = false;
  }

  get provisionedEngines() {
    return (this.engines || []).filter(
      e => e.state === EngineState.PROVISIONED,
    );
  }

  setSelectedEngine(engine: string) {
    this.selectedEngine = engine;
    this.saveState();
  }

  private setEngines(engines: Engine[]) {
    if (!engines.some(c => c.name === this.selectedEngine)) {
      this.setSelectedEngine('');
    }

    engines = Object.values({
      ...keyBy(engines, e => e.name),
      ...keyBy(
        this.pendingEngines.map(pe => pe.pendingEngine),
        e => e.name,
      ),
    });

    this.engines = sortBy(engines, e => e.name);

    this.pollIfNeeded();
  }

  private async pollIfNeeded() {
    const shouldPoll = this.engines.some(
      engine => !DELETABLE_STATES.includes(engine.state),
    );

    if (shouldPoll) {
      await new Promise(res => setTimeout(res, this.pollInterval));
      await this.loadEngines();
    }
  }

  private addPendingEngine(engine: Engine) {
    const staleEngine = this.engines.find(e => e.name === engine.name);

    this.pendingEngines.push({ pendingEngine: engine, staleEngine });
    this.setEngines(this.engines);
  }

  private tryRemovePendingEngines(engines: Engine[]) {
    const enginesMap = keyBy(engines, e => e.name);

    this.pendingEngines = this.pendingEngines.filter(pe =>
      isEqual(pe.staleEngine, enginesMap[pe.pendingEngine.name]),
    );
  }

  private removePendingEngine(engineName: string) {
    this.pendingEngines = this.pendingEngines.filter(
      pe => pe.pendingEngine.name !== engineName,
    );
  }

  getEngine(engineName: string): Engine | undefined {
    return this.engines.find(engine => engine.name === engineName);
  }

  async loadEngines() {
    if (this.isLoading || !this.isObserved) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = undefined;
    });

    try {
      const engines = await this.client.listEngines(activeStates as any);

      runInAction(() => {
        this.tryRemovePendingEngines(engines);
        this.setEngines(engines);
        this.isLoading = false;
        this.isLoaded = true;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }

  async deleteEngine(engineName: string) {
    const promise = this.client.deleteEngine(engineName);
    const existingEngine = this.engines.find(e => e.name === engineName);

    if (existingEngine) {
      const pendingEngine: Engine = {
        ...existingEngine,
        state: EngineState.DEPROVISIONING,
      };

      this.addPendingEngine(pendingEngine);
    }

    try {
      await promise;
    } catch (error: any) {
      this.removePendingEngine(engineName);
      throw error;
    }
  }

  async createEngine(engineName: string, size = EngineSize.XS) {
    const engine = await this.client.createEngine(engineName, size);

    this.addPendingEngine(engine);
  }

  async resumeEngine(engineName: string) {
    const promise = this.client.resumeEngine(engineName);
    const existingEngine = this.engines.find(e => e.name === engineName);

    if (existingEngine) {
      const pendingEngine: Engine = {
        ...existingEngine,
        state: EngineState.REQUESTED,
      };

      this.addPendingEngine(pendingEngine);
    }

    try {
      await promise;
    } catch (error: any) {
      this.removePendingEngine(engineName);
      throw error;
    }
  }

  async suspendEngine(engineName: string) {
    const promise = this.client.suspendEngine(engineName);
    const existingEngine = this.engines.find(e => e.name === engineName);

    if (existingEngine) {
      const pendingEngine: Engine = {
        ...existingEngine,
        state: EngineState.SUSPENDED,
      };

      this.addPendingEngine(pendingEngine);
    }

    try {
      await promise;
    } catch (error: any) {
      this.removePendingEngine(engineName);
      throw error;
    }
  }

  private readState() {
    const emptyState: StoredState = {
      selectedEngines: {},
    };

    try {
      const stateStr = sessionStorage.getItem(STORAGE_KEY);
      const state: StoredState = stateStr ? JSON.parse(stateStr) : emptyState;

      return state;
    } catch {
      return emptyState;
    }
  }

  private saveState() {
    const state = this.readState();

    state.selectedEngines[this.accountId] = this.selectedEngine;

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
