import { makeAutoObservable, observable, runInAction } from 'mobx';

import { DisplayMode } from '@relationalai/output-arrow';
import {
  Client,
  ResultTable,
  SdkError,
  TransactionAsyncResult,
} from '@relationalai/rai-sdk-javascript/web';
import { filterOutput } from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';
import { TransactionTags } from '../utils/sdkUtils';

export const STORAGE_KEY = 'baseRelationStore';

type StoredState = {
  engine: string;
};

type StorageState = {
  // key = accountId + databaseName + baseRelationName
  [key: string]: StoredState;
};

export class BaseRelationStore {
  response?: TransactionAsyncResult = undefined;
  isRunning = false;
  startedAt?: number = undefined;
  finishedAt?: number = undefined;
  execError?: SdkError = undefined;
  mode = DisplayMode.LOGICAL;
  transactionId?: string = undefined;
  storedState: StoredState = {
    engine: '',
  };
  private limit?: number = 100;

  constructor(
    private syncStore: SyncStore,
    private accountId: string,
    public databaseId: string,
    public name: string,
    public client: Client,
  ) {
    makeAutoObservable<BaseRelationStore>(this, {
      client: false,
      response: observable.ref,
    });

    this.initStoredState();
  }

  setOutputLimit(limit: number | undefined) {
    this.limit = limit;
  }

  get outputLimit() {
    return this.limit;
  }

  setMode(mode: DisplayMode) {
    this.mode = mode;
  }

  get errorCount() {
    return this.execError ? 1 : 0;
  }

  get output() {
    return filterOutput(this.response?.results ?? [])
      .filter(r => {
        const t = new ResultTable(r);
        const firstCol = t.columnAt(0);

        return (
          firstCol &&
          firstCol.typeDef.type === 'Constant' &&
          firstCol.typeDef.value.value === `:${this.resultRelation}`
        );
      })
      .map(r => ({
        relationId: r.relationId.replace(`/:${this.resultRelation}/`, '/'),
        table: r.table,
        metadata: {
          arguments: r.metadata.arguments.slice(1),
        },
      }));
  }

  get engine() {
    return this.storedState.engine;
  }

  private get resultRelation() {
    return `__base_relation_${this.name}__`;
  }

  setEngine(engine: string) {
    this.storedState.engine = engine;
    this.writeStorage('session');
  }

  async load(force = false) {
    if (!force && (this.isRunning || !this.engine || this.response)) {
      return;
    }

    const value =
      this.limit && this.limit > 0
        ? `def output:${this.resultRelation}(rest...) = top[${this.limit}, ${this.name}](_, rest...)`
        : `def output:${this.resultRelation}(rest...) = ${this.name}(rest...)`;

    if (value && this.databaseId && this.engine) {
      runInAction(() => {
        this.isRunning = true;
        this.startedAt = Date.now();
        this.execError = undefined;
        this.mode = DisplayMode.LOGICAL;
      });

      this.writeStorage('local');

      try {
        const response = await this.client.execAsync(
          this.databaseId,
          this.engine,
          value,
          [],
          true,
          [TransactionTags.CONSOLE_USER],
        );

        runInAction(() => {
          this.transactionId = response.transaction.id;
        });

        if ('results' in response) {
          runInAction(() => {
            this.isRunning = false;
            this.response = response;
            this.finishedAt = Date.now();
          });
        } else {
          const pollResponse = await this.syncStore.pollTransaction(
            this.client,
            response.transaction.id,
          );

          runInAction(() => {
            this.isRunning = false;
            this.finishedAt = Date.now();
            this.response = pollResponse;
          });
        }
      } catch (error_: any) {
        runInAction(() => {
          this.isRunning = false;
          this.execError = error_;
          this.finishedAt = Date.now();
        });
      }
    }
  }

  private getKey() {
    return `${this.accountId}-${this.databaseId}-${this.name}`;
  }

  private initStoredState() {
    const key = this.getKey();
    const sessionState = this.readStorage('session');

    if (sessionState[key]) {
      this.storedState = sessionState[key];

      return;
    }

    const localState = this.readStorage('local');

    if (localState[key]) {
      this.storedState = localState[key];
    }
  }

  private readStorage(type: 'local' | 'session') {
    const emptyState: StorageState = {};

    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const stateStr = storage.getItem(STORAGE_KEY);
      const state: StorageState = stateStr ? JSON.parse(stateStr) : emptyState;

      return state;
    } catch {
      return emptyState;
    }
  }

  private writeStorage(type: 'local' | 'session') {
    const state = this.readStorage(type);

    state[this.getKey()] = this.storedState;

    const storage = type === 'local' ? localStorage : sessionStorage;

    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
