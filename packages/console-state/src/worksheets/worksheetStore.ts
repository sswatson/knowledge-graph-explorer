import { debounce, isEqual, pick, pickBy, sortBy } from 'lodash-es';
import { makeAutoObservable, observable, runInAction } from 'mobx';

import {
  flattenDiagnostics,
  getOutputGroups,
  Line,
  offsetPartialQueryDiagnostics,
  SelectionRange,
  toEditorDiagnostics,
} from '@relationalai/code-editor';
import {
  getRelDefinitions,
  RelDefinition,
} from '@relationalai/editor-extensions';
import {
  AbortError,
  ArrowRelation,
  Client,
  ResultTable,
  SdkError,
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import {
  Diagnostic,
  filterDuplicateDiagnostics,
  filterOutput,
  IcViolation,
  parseDiagnostics,
  parseIcViolations,
} from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';
import { SvcError, SvcErrorCode } from '../errors';
import { RequestProps } from '../utils/makeRequest';
import { checkSystemInternals, TransactionTags } from '../utils/sdkUtils';

export const AUTOSAVE_DEBOUNCE_PERIOD_MS = 1000;

export function getWorksheetPath(accountId: string) {
  return [
    process.env.NEXT_PUBLIC_CONSOLE_SERVICES_ORIGIN,
    'console-service/v1alpha2',
    accountId,
    'worksheets',
  ].join('/');
}

export function generateName() {
  const date = new Date();
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join(
    '-',
  );
  const minutes = date.getMinutes().toString();
  const time = [date.getHours(), minutes.padStart(2, '0')].join(':');

  return `Untitled ${day} ${time}`;
}

// body limit on the server side is 1MB
// we limit the value at 900000
// so that there's room for the other worksheet fields
const MAX_VALUE_LENGTH = 900000;

export type Worksheet = {
  name: string;
  id: string;
  value?: string;
  createdBy: string;
  createdOn: number;
  updatedBy: string;
  updatedOn: number;
  readOnly: boolean;
  displayMode?: string;
};

export type UpdatePayload = {
  name?: string;
  value?: string;
  databaseName?: string;
  readOnly?: boolean;
};

export const STORAGE_KEY = 'worksheetStore';

type StoredState = {
  engineName: string;
  databaseName: string;
  isNew?: boolean;
};

type StorageState = {
  // key = accountId + worksheetId
  [key: string]: StoredState;
};

export default class WorksheetStore {
  response?: TransactionAsyncResult = undefined;
  uiState?: Worksheet = undefined;
  serverState?: Worksheet = undefined;
  initNewState?: Worksheet = undefined;
  storedState: StoredState = {
    engineName: '',
    databaseName: '',
  };

  transactionId?: string = undefined;
  startedAt?: number = undefined;
  finishedAt?: number = undefined;
  isRunning = false;
  isLoaded = false;
  isLoading = false;
  isSaving = false;
  isCancelling = false;
  isNotFound = false;
  loadError?: SvcError = undefined;
  updateError?: SvcError = undefined;
  execError?: SdkError = undefined;
  lastSaveTime?: Date = undefined;
  definitions: RelDefinition[] = [];
  selection?: SelectionRange = undefined;
  selectionStartFromLine?: Line = undefined;
  lastSelection?: SelectionRange = undefined;
  lastSelectionStartFromLine?: Line = undefined;

  lastUsedDatabase?: string = undefined;
  lastUsedReadOnly?: boolean = undefined;
  private abortController?: AbortController = undefined;
  private lastUsedValue?: string = undefined;

  private outputGroups: string[] = [];
  private baseUrl: string;

  constructor(
    private syncStore: SyncStore,
    private accountId: string,
    public worksheetId: string,
    public client: Client,
    public request: <T>(props: RequestProps) => Promise<{ data: T }>,
    isNew?: boolean,
  ) {
    makeAutoObservable<WorksheetStore>(this, {
      client: false,
      request: false,
      response: observable.ref,
    });

    this.initStoredState();
    this.baseUrl = getWorksheetPath(accountId);

    if (isNew) {
      this.setIsNew(isNew);
    }

    if (this.isNew) {
      this.initNewState = {
        id: worksheetId,
        name: generateName(),
        createdBy: '',
        createdOn: 0,
        readOnly: true,
        updatedBy: '',
        updatedOn: 0,
        value: '',
      };
      this.uiState = {
        ...this.initNewState,
      };
    }
  }

  get canCancel() {
    return this.isRunning && !!this.transactionId;
  }

  get isDirty() {
    const fields = ['value', 'name', 'readOnly', 'displayMode'];

    if (this.isNew) {
      return !isEqual(
        pick(this.uiState, fields),
        pick(this.initNewState, fields),
      );
    } else {
      return !isEqual(
        pick(this.uiState, fields),
        pick(this.serverState, fields),
      );
    }
  }

  get output() {
    return sortBy(
      filterOutput(this.response?.results ?? []),
      (relation: ArrowRelation) => {
        const resultTable = new ResultTable(relation);
        const typeDef = resultTable.typeDefs()[0];

        const group =
          typeDef &&
          typeDef.type === 'Constant' &&
          typeDef.value.type === 'String'
            ? typeDef?.value?.value
            : '';

        return this.outputGroups.indexOf(group);
      },
    );
  }

  get diagnostics() {
    if (
      !isEqual(this.lastUsedValue, this.value) ||
      this.isRunning ||
      this.isCancelling
    ) {
      return [];
    }

    let diagnostics = parseDiagnostics(this.response?.results ?? []);

    diagnostics = filterDuplicateDiagnostics(diagnostics);

    if (
      this.lastSelection &&
      !this.lastSelection.empty &&
      this.lastSelectionStartFromLine
    ) {
      diagnostics = offsetPartialQueryDiagnostics<Diagnostic>(
        diagnostics,
        this.lastSelection,
        this.lastSelectionStartFromLine,
      );
    }

    return flattenDiagnostics(diagnostics);
  }

  get icViolations() {
    if (
      !isEqual(this.lastUsedValue, this.value) ||
      this.isRunning ||
      this.isCancelling
    ) {
      return [];
    }

    let icViolations = parseIcViolations(this.response?.results ?? []);

    if (
      this.lastSelection &&
      !this.lastSelection.empty &&
      this.lastSelectionStartFromLine
    ) {
      icViolations = offsetPartialQueryDiagnostics<IcViolation>(
        icViolations,
        this.lastSelection,
        this.lastSelectionStartFromLine,
      );
    }

    return icViolations;
  }

  private get worksheetProblems() {
    return [...this.diagnostics, ...this.icViolations].filter(d => !d.model);
  }

  get editorDiagnostics() {
    return toEditorDiagnostics(
      this.diagnostics.filter(d => !d.model),
      this.value,
    );
  }

  get gutterHighlightRange(): SelectionRange | undefined {
    return this.lastSelection &&
      !this.lastSelection.empty &&
      this.lastSelection.to - this.lastSelection.from < this.value.length
      ? this.lastSelection
      : undefined;
  }

  setSelection(selection: SelectionRange) {
    this.selection = selection;
  }

  setSelectionStartFromLine(line: Line) {
    this.selectionStartFromLine = line;
  }

  setName(name: string) {
    if (this.uiState) {
      this.uiState.name = name;
      this.save();
    }
  }

  get name() {
    return this.uiState?.name ?? '';
  }

  setDisplayMode(mode: string) {
    if (this.uiState) {
      this.uiState.displayMode = mode;
      this.save();
    }
  }

  get displayMode() {
    return this.uiState?.displayMode ?? '';
  }

  get value() {
    return this.uiState?.value ?? '';
  }

  setValue(editorValue: string) {
    if (this.uiState) {
      this.uiState.value = editorValue;

      if (editorValue.length <= MAX_VALUE_LENGTH) {
        this.updateError = undefined;
        this.save();
      } else {
        this.updateError = new Error('Maximum worksheet length has reached.');
      }
    }
  }

  get readOnly() {
    return this.uiState?.readOnly ?? false;
  }

  setReadOnly(readOnly: boolean) {
    if (this.uiState) {
      this.uiState.readOnly = readOnly;
      this.save();
    }
  }

  get databaseName() {
    return this.storedState.databaseName;
  }

  setDatabaseName(databaseName: string) {
    this.storedState.databaseName = databaseName;
    this.writeStorage('session');
  }

  get errorCount() {
    return (
      (this.loadError ? 1 : 0) +
      (this.updateError ? 1 : 0) +
      (this.execError ? 1 : 0)
    );
  }

  get problemCount() {
    return this.diagnostics.length + this.icViolations.length;
  }

  get engineName() {
    return this.storedState.engineName;
  }

  setEngineName(engine: string) {
    this.storedState.engineName = engine;
    this.abortController?.abort();
    this.writeStorage('session');
  }

  get isNew() {
    return !!this.storedState.isNew;
  }

  setIsNew(value?: boolean) {
    this.storedState.isNew = value;
    this.writeStorage('session');
    this.writeStorage('local');
  }

  private setResponse(response: TransactionAsyncResult) {
    runInAction(() => {
      this.response = response;
      this.transactionId = response.transaction.id;

      if (
        this.lastUsedReadOnly === false &&
        response.transaction.state === TransactionAsyncState.COMPLETED &&
        this.lastUsedDatabase
      ) {
        this.syncStore.loadBaseRelations(this.lastUsedDatabase);
      }

      if (this.output.length) {
        this.syncStore.selectBottomTab('output');
      } else if (this.worksheetProblems.length) {
        this.syncStore.selectBottomTab('problems');
      }
    });
  }

  async loadWorksheet() {
    if (this.isLoading || this.isNew) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
    });

    try {
      const response = await this.request<Worksheet>({
        url: `${this.baseUrl}/${encodeURIComponent(this.worksheetId)}`,
      });

      runInAction(() => {
        this.setWorksheet(response.data);
        this.loadError = undefined;
        this.isLoading = false;
        this.isLoaded = true;
        this.isNotFound = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.isNotFound = error.errorCode === SvcErrorCode.NOT_FOUND;
        this.loadError = !this.isNotFound ? error : undefined;
        this.isLoading = false;
      });
    }
  }

  private setWorksheet(worksheet: Worksheet) {
    if (this.uiState === undefined || this.isNew) {
      this.uiState = worksheet;
    }

    if (this.isNew) {
      this.setIsNew(undefined);
    }

    this.serverState = worksheet;
    this.analyzeWorksheetDefinitions();
  }

  async saveWorksheet() {
    if (this.isSaving || !this.isDirty) {
      return;
    }

    const updatePayload = pickBy(
      this.uiState,
      (_, key) =>
        (this.uiState as any)?.[key] !== (this.serverState as any)?.[key],
    );

    await this.updateWorksheet(updatePayload);
  }

  private save = debounce(this.saveWorksheet, AUTOSAVE_DEBOUNCE_PERIOD_MS);

  private async updateWorksheet(payload: UpdatePayload) {
    if (this.uiState) {
      runInAction(() => {
        this.isSaving = true;
      });

      const data: any = {
        ...payload,
      };

      if (this.isNew) {
        data.id = this.worksheetId;
      }

      try {
        const response = await this.request<Worksheet>({
          url: this.isNew
            ? this.baseUrl
            : `${this.baseUrl}/${encodeURIComponent(this.worksheetId)}`,
          data,
          method: this.isNew ? 'POST' : 'PATCH',
        });

        runInAction(() => {
          this.setWorksheet(response.data);
          this.updateError = undefined;
          this.isSaving = false;
          this.isLoaded = true;
          this.lastSaveTime = new Date();
        });
      } catch (error: any) {
        runInAction(() => {
          this.updateError = error;
          this.isSaving = false;
        });
      }
    }
  }

  async runWorksheet() {
    if (this.value && this.databaseName) {
      this.writeStorage('local');

      runInAction(() => {
        this.startedAt = Date.now();
        this.isRunning = true;
        this.finishedAt = undefined;
        this.transactionId = undefined;
        this.lastSelection = this.selection;
        this.lastSelectionStartFromLine = this.selectionStartFromLine;
        this.lastUsedDatabase = this.databaseName;
        this.lastUsedReadOnly = this.readOnly;
        this.lastUsedValue = this.value;
        this.outputGroups = getOutputGroups(this.value);
        this.abortController = new AbortController();
        this.response = undefined;
      });

      try {
        const response = await this.client.execAsync(
          this.databaseName,
          this.engineName,
          this.lastSelection && !this.lastSelection.empty
            ? this.value.slice(this.lastSelection.from, this.lastSelection.to)
            : this.value,
          [],
          this.readOnly,
          [TransactionTags.CONSOLE_USER],
        );

        runInAction(() => {
          this.transactionId = response.transaction.id;
        });

        if ('results' in response) {
          runInAction(() => {
            this.execError = undefined;
            this.isRunning = false;
            this.finishedAt = Date.now();
            this.setResponse(response);
          });

          await checkSystemInternals(
            this.client,
            response.transaction,
            this.diagnostics,
          );
        } else {
          const pollResponse = await this.syncStore.pollTransaction(
            this.client,
            response.transaction.id,
            this.abortController?.signal,
          );

          runInAction(() => {
            this.execError = undefined;
            this.isRunning = false;
            this.finishedAt = Date.now();
            this.isCancelling = false;
            this.setResponse(pollResponse);
          });

          await checkSystemInternals(
            this.client,
            pollResponse.transaction,
            this.diagnostics,
          );
        }
      } catch (error_: any) {
        runInAction(() => {
          if (!(error_ instanceof AbortError)) {
            this.execError = error_;
          }

          this.isRunning = false;
          this.isCancelling = false;
          this.finishedAt = Date.now();
        });
      }
    }
  }

  async cancelTransaction() {
    if (this.isCancelling || !this.canCancel) {
      return;
    }

    runInAction(() => {
      this.isCancelling = true;
    });

    try {
      await this.client.cancelTransaction(this.transactionId ?? '');
      runInAction(() => {
        this.execError = undefined;
      });
    } catch {
      runInAction(() => {
        this.execError = {
          name: 'Internal error',
          message: 'Internal error while cancelling transaction.',
        };
        this.isCancelling = false;
      });
    }
  }

  analyzeWorksheetDefinitions() {
    const definitions = getRelDefinitions(this.value, {
      worksheetId: this.worksheetId,
      name: this.name,
      type: 'worksheet',
    });

    if (!isEqual(definitions, this.definitions)) {
      this.definitions = definitions;
    }
  }

  private getKey() {
    return `${this.accountId}-${this.worksheetId}`;
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
