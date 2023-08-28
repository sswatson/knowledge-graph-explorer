import { isEqual } from 'lodash-es';
import { makeAutoObservable, observable, runInAction } from 'mobx';

import {
  flattenDiagnostics,
  SelectionRange,
  toEditorDiagnostics,
} from '@relationalai/code-editor';
import {
  getRelDefinitions,
  RelDefinition,
} from '@relationalai/editor-extensions';
import {
  Client,
  ResultTable,
  SdkError,
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import {
  downloadString,
  filterResults,
  parseDiagnostics,
  parseIcViolations,
} from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';
import {
  checkSystemInternals,
  v2InstallModelAsync,
  v2loadModel,
} from '../utils/sdkUtils';

export type Model = {
  name: string;
  value: string;
  errorCount?: number;
  isLocal?: boolean;
};

export const STORAGE_KEY = 'modelStore';

type StoredState = {
  engineName: string;
};

type StorageState = {
  // key = accountId + databaseName + modelName
  [key: string]: StoredState;
};

export class ModelStore {
  isLoading = false;
  isSaving = false;
  isCancelling = false;
  inflightTransactionId?: string = undefined;
  abortedResponse?: TransactionAsyncResult = undefined;
  response?: TransactionAsyncResult = undefined;
  selection?: SelectionRange = undefined;
  definitions: RelDefinition[] = [];
  isLoaded = false;
  private _abortedError?: SdkError = undefined;
  private _error?: SdkError = undefined;
  private editorValue = '';
  private lastUsedValue?: string = undefined;
  storedState: StoredState = {
    engineName: '',
  };

  constructor(
    private syncStore: SyncStore,
    private accountId: string,
    public client: Client,
    public databaseId: string,
    public name: string,
  ) {
    makeAutoObservable<ModelStore>(this, {
      client: false,
      response: observable.ref,
      abortedResponse: observable.ref,
    });

    this.initStoredState();
  }

  get transactionId() {
    const response = this.abortedResponse || this.response;

    return response?.transaction.id;
  }

  get error() {
    return this._abortedError || this._error;
  }

  get diagnostics() {
    if (
      !isEqual(this.value, this.lastUsedValue) ||
      this.isSaving ||
      this.isCancelling
    ) {
      return [];
    }

    const response = this.abortedResponse || this.response;

    const diagnostics = parseDiagnostics(response?.results || []).filter(
      d => d.model === this.name || (!d.model && !d.range),
    );

    return flattenDiagnostics(diagnostics);
  }

  get editorDiagnostics() {
    return toEditorDiagnostics(this.diagnostics, this.value || '');
  }

  get icViolations() {
    if (this.isSaving || this.isCancelling) {
      return [];
    }

    const response = this.abortedResponse || this.response;

    return parseIcViolations(response?.results ?? []);
  }

  get errorCount() {
    return (
      this.diagnostics.length + this.icViolations.length + (this.error ? 1 : 0)
    );
  }

  get model(): Model {
    const modelValue =
      this.response && readModelValue(this.response, this.name);

    return {
      value: modelValue || '',
      name: this.name,
      errorCount: this.errorCount,
      isLocal: this.isLocal,
    };
  }

  get isLocal() {
    if (this.response) {
      // it's local when model value isn't in the last response

      return (
        !this.response || readModelValue(this.response, this.name) === undefined
      );
    }

    return false;
  }

  get value() {
    return this.editorValue;
  }

  get filename() {
    return this.name.slice(this.name.lastIndexOf('/') + 1);
  }

  get isDirty() {
    return this.editorValue !== this.model.value;
  }

  get canCancel() {
    return !!(this.isSaving && this.inflightTransactionId);
  }

  async loadModel() {
    if (this.isLoading || this.isSaving || !this.engineName) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
    });

    try {
      const response = await v2loadModel(
        this.client,
        this.databaseId,
        this.engineName,
        this.name,
      );

      runInAction(() => {
        this.isLoading = false;
        this._error = undefined;
        this.setResponse(response, false);
      });
    } catch (error: any) {
      runInAction(() => {
        this.isLoading = false;
        this._error = error;
      });
    }
  }

  async installModel() {
    runInAction(() => {
      this.inflightTransactionId = undefined;
      this.isSaving = true;
      this.lastUsedValue = this.editorValue;
    });

    this.writeStorage('local');

    try {
      const response = await v2InstallModelAsync(
        this.client,
        this.databaseId,
        this.engineName,
        {
          value: this.editorValue || '',
          name: this.name,
        },
      );

      if ('results' in response) {
        this.setResponse(response, true);
        await checkSystemInternals(this.client, response.transaction);
        runInAction(() => {
          this.isSaving = false;
          this._error = undefined;
          this._abortedError = undefined;
        });
      } else {
        runInAction(() => {
          this.inflightTransactionId = response.transaction.id;
        });

        const pollResponse = await this.syncStore.pollTransaction(
          this.client,
          response.transaction.id,
        );

        runInAction(() => {
          this.inflightTransactionId = undefined;
        });

        this.setResponse(pollResponse, true);
        await checkSystemInternals(this.client, pollResponse.transaction);
        runInAction(() => {
          this.isSaving = false;
          this.isCancelling = false;
          this._error = undefined;
          this._abortedError = undefined;
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this._abortedError = error;
        this.isSaving = false;
        this.isCancelling = false;
      });
    }
  }

  async cancelInstallModel() {
    if (this.isCancelling || !this.canCancel || !this.inflightTransactionId) {
      return;
    }

    runInAction(() => {
      this.isCancelling = true;
    });

    try {
      await this.client.cancelTransaction(this.inflightTransactionId);
    } catch {
      runInAction(() => {
        this._error = {
          name: 'Internal error',
          message: 'Internal error while cancelling transaction.',
        };
      });
    }
  }

  exportModel() {
    const filename = this.name.endsWith('.rel')
      ? this.name
      : `${this.name}.rel`;

    downloadString(this.model.value, 'text/plain', filename);
  }

  setResponse(response: TransactionAsyncResult, installing: boolean) {
    // getting dirty state before we set response
    const isDirty = this.isDirty;

    if (installing) {
      if (response.transaction.state === TransactionAsyncState.ABORTED) {
        // Can't trust models from aborted responses
        // we store it separately so that we still can read diagnostics and ic violations
        this.abortedResponse = response;
      } else {
        // if it's not aborted when trust the models in the response
        this.abortedResponse = undefined;
        this.response = response;
      }
    } else {
      this.response = response;
    }

    if (!isDirty) {
      this.editorValue = this.model.value;
    } else {
      this.analyzeModelCompletions();
    }

    // this should be triggered just once
    // after initial model loading
    if (!this.isLoaded) {
      this.lastUsedValue = this.model.value;
      this.analyzeModelCompletions();
      this.isLoaded = true;
    }
  }

  setValue(value: string) {
    this.editorValue = value;
  }

  setSelection(sel: SelectionRange) {
    this.selection = sel;
  }

  // used for renaming in the list store
  setName(name: string) {
    this.name = name;
  }

  analyzeModelCompletions() {
    const definitions = getRelDefinitions(this.value, {
      name: this.name,
      type: 'model',
      databaseName: this.databaseId,
    });

    if (!isEqual(definitions, this.definitions)) {
      this.definitions = definitions;
    }
  }

  get engineName() {
    return this.storedState.engineName;
  }

  setEngineName(engine: string) {
    this.storedState.engineName = engine;
    this.writeStorage('session');
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

function readModelValue(response: TransactionAsyncResult, name: string) {
  const results = response.results.map(r => new ResultTable(r));
  const resultTables = filterResults(results, [':output', ':__model__']);
  const resultTable = resultTables[0];

  if (resultTable) {
    const physical = resultTable.physical();
    const nameColumn = physical.columnAt(0);
    const names = nameColumn.values();
    const modelIndex = names.indexOf(name);

    if (modelIndex > -1) {
      const row = physical.get(modelIndex);

      if (row) {
        return row[1] as string;
      }
    }
  }
}
