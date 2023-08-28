import { localStorage, sessionStorage } from '@shopify/jest-dom-mocks';
import { waitFor } from '@testing-library/react';
import { configure, when } from 'mobx';

import {
  getOutputGroups,
  offsetPartialQueryDiagnostics,
  SelectionRange,
  Text,
} from '@relationalai/code-editor';
import {
  getRelDefinitions,
  RelDefinition,
} from '@relationalai/editor-extensions';
import {
  AbortError,
  Client,
  TransactionAsyncCompact,
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import {
  filterOutput,
  parseDiagnostics,
  parseIcViolations,
  plainToArrow,
} from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';
import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import { SvcError, SvcErrorCode } from '../errors';
import { RequestProps } from '../utils/makeRequest';
import { TransactionTags } from '../utils/sdkUtils';
import WorksheetStore, {
  AUTOSAVE_DEBOUNCE_PERIOD_MS,
  generateName,
  getWorksheetPath,
  STORAGE_KEY,
  Worksheet,
} from './worksheetStore';
import { mockWorksheet } from './worksheetStoreMock';

const accountId = 'accId';
const engineName = 'engineName';
const databaseName = 'databaseName';
const transactionId = 'transactionId';
const worksheetApiUrl = getWorksheetPath(accountId);

const txnResultMock: TransactionAsyncResult = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
    {
      relationId: '/:output/:bar/Int64/String',
      columns: [
        [BigInt(5), BigInt(6)],
        ['message 5', 'message 6'],
      ],
    },
    {
      relationId: '/:output/:foo/Int64/String',
      columns: [
        [BigInt(3), BigInt(4)],
        ['message 3', 'message 4'],
      ],
    },
    {
      relationId: '/:output/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['message 1', 'message 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:code/Int64/String',
      columns: [
        [BigInt(1), BigInt(2), BigInt(3)],
        ['PARSE_ERROR', 'UNBOUND_VARIABLE', 'UNBOUND_VARIABLE'],
      ],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:start/:line/Int64/Int64/Int64',
      columns: [
        [BigInt(1), BigInt(1)],
        [1, 2],
        [1, 1],
      ],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:start/:character/Int64/Int64/Int64',
      columns: [
        [BigInt(1), BigInt(1)],
        [1, 2],
        [1, 1],
      ],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:end/:line/Int64/Int64/Int64',
      columns: [
        [BigInt(1), BigInt(1)],
        [1, 2],
        [1, 1],
      ],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:end/:character/Int64/Int64/Int64',
      columns: [
        [BigInt(1), BigInt(1)],
        [1, 2],
        [5, 3],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:report/Int64/String',
      columns: [
        [BigInt(1), BigInt(2), BigInt(3)],
        ['report 1', 'report 2', 'report 3'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:model/Int64/String',
      columns: [[BigInt(3)], ['modelName']],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#constaint#0',
      columns: [[[BigInt(123), BigInt(0)]]],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:report/HashValue/String',
      columns: [[[BigInt(123), BigInt(0)]], ['report 1']],
    },
  ]),
};
const txnCompactMock: {
  transaction: TransactionAsyncCompact;
} = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.COMPLETED,
  },
};
const abortedTxnResultMock: TransactionAsyncResult = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.ABORTED,
    abort_reason: 'system internal error',
    account_name: 'account id',
    database_name: databaseName,
    engine_name: engineName,
    read_only: true,
    last_requested_interval: 0,
    query: 'query text',
    query_size: 0,
    language: '',
    user_agent: 'user_agent',
    response_format_version: '2',
  },
  results: [],
};

const abortedTxnResultMockCompact: {
  transaction: TransactionAsyncCompact;
} = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.ABORTED,
  },
};

const icViolationsMock = [
  {
    decl_id: ':rel-query-action##123#constaint#0',
    report: 'report 1',
    output: [],
  },
];

const diagnosticsMock = [
  {
    code: 'PARSE_ERROR',
    report: 'report 1',
    range: [
      {
        start: { line: 1, character: 1 },
        end: { line: 1, character: 5 },
      },
    ],
  },
  {
    code: 'PARSE_ERROR',
    report: 'report 1',
    range: [
      {
        start: { line: 1, character: 1 },
        end: { line: 1, character: 3 },
      },
    ],
  },
  { code: 'UNBOUND_VARIABLE', report: 'report 2' },
  { code: 'UNBOUND_VARIABLE', report: 'report 3', model: 'modelName' },
];

const editorDiagnosticMock = [
  {
    from: 0,
    to: 5,
    severity: 'warning',
    message: '⚠ PARSE_ERROR\n\t',
    original: diagnosticsMock[0],
  },
  {
    from: 0,
    to: 3,
    severity: 'warning',
    message: '⚠ PARSE_ERROR\n\t',
    original: diagnosticsMock[1],
  },
];

function createWorksheetStore({
  clientMock,
  worksheetMock,
  requestMock,
  syncStoreMock,
  isNew,
}: {
  clientMock?: Client;
  requestMock?: <T>(props: RequestProps) => Promise<{ data: T }>;
  worksheetMock?: Worksheet;
  syncStoreMock?: SyncStore;
  isNew?: boolean;
} = {}) {
  const worksheet = worksheetMock ?? mockWorksheet();
  const client = clientMock ?? createClientMock();
  const request =
    requestMock ??
    jest.fn().mockResolvedValue({
      data: worksheet,
    });

  return {
    clientMock: client,
    worksheetMock: worksheet,
    requestMock: request,
    store: new WorksheetStore(
      syncStoreMock ?? createSyncStoreMock(),
      accountId,
      worksheet.id,
      client,
      request,
      !!isNew,
    ),
  };
}

const outputGroups = [':foo', ':bar'];

jest.mock('@relationalai/code-editor', () => ({
  ...jest.requireActual('@relationalai/code-editor'),
  offsetPartialQueryDiagnostics: jest.fn(() => diagnosticsMock),
  getOutputGroups: jest.fn(() => outputGroups),
}));

jest.mock('@relationalai/editor-extensions');

describe('Worksheet Store', () => {
  configure({
    safeDescriptors: false,
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.restore();
    sessionStorage.restore();
  });

  it('should read stored state from session storage', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accId-worksheetId': { engineName: 'foo', databaseName: 'bar' },
      }),
    );
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accId-worksheetId': {
          engineName: 'testEngine',
          databaseName: 'testDb',
        },
      }),
    );

    const { store } = createWorksheetStore();

    expect(store.engineName).toEqual('foo');
    expect(store.databaseName).toEqual('bar');
  });

  it('should read stored state from local storage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accId-worksheetId': {
          engineName: 'testEngine',
          databaseName: 'testDb',
        },
      }),
    );

    const { store } = createWorksheetStore();

    expect(store.engineName).toEqual('testEngine');
    expect(store.databaseName).toEqual('testDb');
  });

  it('should get canCancel', () => {
    const { store } = createWorksheetStore();

    expect(store.canCancel).toStrictEqual(false);

    store.isRunning = true;
    store.transactionId = 'transactionId';

    expect(store.canCancel).toStrictEqual(true);
  });

  it('should get isDirty', async () => {
    const { store, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    store.serverState = worksheetMock;

    expect(store.isDirty).toStrictEqual(false);

    store.uiState.value = `new-${worksheetMock.value}`;
    expect(store.isDirty).toStrictEqual(true);

    store.serverState.value = store.uiState.value;
    expect(store.isDirty).toStrictEqual(false);

    store.uiState.name = `new-${worksheetMock.name}`;
    expect(store.isDirty).toStrictEqual(true);

    store.serverState.name = store.uiState.name;
    expect(store.isDirty).toStrictEqual(false);

    store.uiState.readOnly = !store.serverState.readOnly;
    expect(store.isDirty).toStrictEqual(true);

    store.serverState.readOnly = store.uiState.readOnly;
    expect(store.isDirty).toStrictEqual(false);
  });

  it('should get isDirty for new worksheet', async () => {
    const { store, worksheetMock } = createWorksheetStore({ isNew: true });

    store.uiState = worksheetMock;
    store.initNewState = { ...worksheetMock };

    expect(store.isDirty).toStrictEqual(false);

    store.uiState.value = `new-${worksheetMock.value}`;
    expect(store.isDirty).toStrictEqual(true);
  });

  it('should get output', () => {
    const { store } = createWorksheetStore();
    const outputs = filterOutput(txnResultMock.results);

    store.response = txnResultMock;
    store['outputGroups'] = outputGroups;
    expect(store.output).toStrictEqual([outputs[2], outputs[1], outputs[0]]);
  });

  it('should get problem count', () => {
    const { store } = createWorksheetStore();

    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    expect(store.problemCount).toStrictEqual(5);
  });

  it('should get error count', () => {
    const { store } = createWorksheetStore();

    store.execError = new Error('exec error');
    store.updateError = new Error('update error');
    store.loadError = new Error('load error');
    expect(store.errorCount).toStrictEqual(3);
  });

  it('should get diagnostics & editor diagnostics', () => {
    const { store, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    expect(store.diagnostics).toStrictEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticMock);
  });

  it('should get diagnostics with offset', () => {
    jest
      .mocked(offsetPartialQueryDiagnostics)
      .mockReturnValue(diagnosticsMock as any);
    const { store, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    store.lastSelection = SelectionRange.fromJSON({ anchor: 2, head: 5 });
    store.lastSelectionStartFromLine = Text.of([store.value]).lineAt(
      store.lastSelection.from,
    );
    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(offsetPartialQueryDiagnostics).toHaveBeenCalledWith(
      parseDiagnostics(store.response.results),
      store.lastSelection,
      store.lastSelectionStartFromLine,
    );
  });

  it('should get ic_violations with offset', () => {
    jest
      .mocked(offsetPartialQueryDiagnostics)
      .mockReturnValue(icViolationsMock);
    const { store, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    store.lastSelection = SelectionRange.fromJSON({ anchor: 2, head: 5 });
    store.lastSelectionStartFromLine = Text.of([store.value]).lineAt(
      store.lastSelection.from,
    );
    expect(store.icViolations).toEqual(icViolationsMock);
    expect(offsetPartialQueryDiagnostics).toHaveBeenCalledWith(
      parseIcViolations(store.response.results),
      store.lastSelection,
      store.lastSelectionStartFromLine,
    );
  });

  it('should get worksheet problems', () => {
    const { store } = createWorksheetStore();

    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    expect(store['worksheetProblems']).toEqual([
      ...diagnosticsMock.filter(d => !d.model),
      ...icViolationsMock,
    ]);
  });

  it('should empty diagnostics when editor value change', () => {
    const { store, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticMock);
    store.setValue(`new-${store.value}`);
    expect(store.diagnostics).toEqual([]);
    expect(store.editorDiagnostics).toEqual([]);
  });

  it('should empty diagnostics and IC violations when running', () => {
    const { store, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticMock);
    expect(store.icViolations).toStrictEqual(icViolationsMock);
    store.isRunning = true;
    expect(store.diagnostics).toEqual([]);
    expect(store.editorDiagnostics).toEqual([]);
    expect(store.icViolations).toEqual([]);
  });

  it('should empty diagnostics and IC violations when cancelling', () => {
    const { store, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticMock);
    expect(store.icViolations).toStrictEqual(icViolationsMock);
    store.isCancelling = true;
    expect(store.diagnostics).toEqual([]);
    expect(store.editorDiagnostics).toEqual([]);
    expect(store.icViolations).toEqual([]);
  });

  it('should get ic violations', () => {
    const { store } = createWorksheetStore();

    store.response = txnResultMock;
    store['lastUsedValue'] = store.value;
    expect(store.icViolations).toStrictEqual(icViolationsMock);
  });

  it('should set database name', () => {
    const { store } = createWorksheetStore();

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(store.databaseName).toEqual('');

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        test: 'something',
      }),
    );

    store.setDatabaseName('foo');

    expect(store.databaseName).toEqual('foo');
    expect(store.storedState.databaseName).toEqual('foo');
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).toHaveBeenNthCalledWith(
      2,
      STORAGE_KEY,
      JSON.stringify({
        test: 'something',
        'accId-worksheetId': { engineName: '', databaseName: 'foo' },
      }),
    );
  });

  it('should set engine name', () => {
    const { store } = createWorksheetStore();

    store['abortController'] = new AbortController();

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(store.engineName).toEqual('');
    expect(store['abortController']?.signal.aborted).toBe(false);

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        test: 'something',
      }),
    );

    expect(store.engineName).toEqual('');

    store.setEngineName('foo');

    expect(store.engineName).toEqual('foo');
    expect(store.storedState.engineName).toEqual('foo');
    expect(store['abortController']?.signal.aborted).toBe(true);
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).toHaveBeenNthCalledWith(
      2,
      STORAGE_KEY,
      JSON.stringify({
        test: 'something',
        'accId-worksheetId': { engineName: 'foo', databaseName: '' },
      }),
    );
  });

  it('should set worksheet name', async () => {
    const saveMock = jest.spyOn(WorksheetStore.prototype, 'saveWorksheet');
    const { store, worksheetMock } = createWorksheetStore();
    const worksheetName = worksheetMock.name;
    const newName = `new-${worksheetName}`;

    store.uiState = worksheetMock;
    store.serverState = worksheetMock;

    store.setName(newName);
    expect(store.uiState?.name).toStrictEqual(newName);
    expect(store.serverState?.name).toStrictEqual(worksheetName);
    expect(saveMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(AUTOSAVE_DEBOUNCE_PERIOD_MS);

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
    });
  });

  it('should set worksheet display mode', async () => {
    const saveMock = jest.spyOn(WorksheetStore.prototype, 'saveWorksheet');
    const { store, worksheetMock } = createWorksheetStore();
    const newMode = 'PHYSICAL';

    store.uiState = worksheetMock;
    store.serverState = worksheetMock;

    store.setDisplayMode(newMode);
    expect(store.uiState?.displayMode).toStrictEqual(newMode);
    expect(store.serverState?.displayMode).toBeUndefined();
    expect(saveMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(AUTOSAVE_DEBOUNCE_PERIOD_MS);

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
    });
  });

  it('should set worksheet value', async () => {
    const saveMock = jest.spyOn(WorksheetStore.prototype, 'saveWorksheet');
    const { store, worksheetMock } = createWorksheetStore();
    const worksheetValue = worksheetMock.value;
    const newValue = `new-${worksheetValue}`;

    await store.loadWorksheet();

    store.setValue(newValue);
    expect(store.uiState?.value).toStrictEqual(newValue);
    expect(store.serverState?.value).toStrictEqual(worksheetValue);
    expect(saveMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(AUTOSAVE_DEBOUNCE_PERIOD_MS);

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
    });
  });

  it('should validate value length', async () => {
    const saveMock = jest.spyOn(WorksheetStore.prototype, 'saveWorksheet');
    const { store } = createWorksheetStore();

    await store.loadWorksheet();

    const newValue = 'a'.repeat(1000000);

    store.setValue(newValue);
    expect(store.uiState?.value).toStrictEqual(newValue);
    expect(saveMock).not.toHaveBeenCalled();
    expect(store.updateError?.message).toEqual(
      'Maximum worksheet length has reached.',
    );

    jest.advanceTimersByTime(AUTOSAVE_DEBOUNCE_PERIOD_MS);

    await waitFor(() => {
      expect(saveMock).not.toHaveBeenCalled();
    });
  });

  it('should set worksheet readonly', async () => {
    const saveMock = jest.spyOn(WorksheetStore.prototype, 'saveWorksheet');
    const { store, worksheetMock } = createWorksheetStore();
    const readOnly = worksheetMock.readOnly;
    const newReadOnly = !readOnly;

    await store.loadWorksheet();

    store.setReadOnly(newReadOnly);
    expect(store.uiState?.readOnly).toStrictEqual(newReadOnly);
    expect(store.serverState?.readOnly).toStrictEqual(readOnly);
    expect(saveMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(AUTOSAVE_DEBOUNCE_PERIOD_MS);

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
    });
  });

  it('should load worksheet', async () => {
    const { store, requestMock, worksheetMock } = createWorksheetStore();

    expect(requestMock).not.toHaveBeenCalled();

    const promise = store.loadWorksheet();

    expect(store.isLoading).toBe(true);
    expect(store.isLoaded).toBe(false);
    expect(store.loadError).toBeUndefined();

    await promise;

    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith({
        url: `${worksheetApiUrl}/${worksheetMock.id}`,
      }),
    );
    expect(store.isLoading).toBe(false);
    expect(store.isLoaded).toBe(true);
    expect(store.uiState).toStrictEqual(worksheetMock);
    expect(store.serverState).toStrictEqual(worksheetMock);
  });

  it('should not load worksheet when isNew is true', async () => {
    const { store, requestMock } = createWorksheetStore({ isNew: true });

    expect(requestMock).not.toHaveBeenCalled();

    await store.loadWorksheet();

    expect(requestMock).not.toHaveBeenCalled();
  });

  it('should handle load worksheet error', async () => {
    const error = new Error('load error');
    const { store } = createWorksheetStore({
      requestMock: jest.fn().mockRejectedValue(error),
    });

    await store.loadWorksheet();
    expect(store.uiState).toBeUndefined();
    expect(store.isLoading).toBe(false);
    expect(store.loadError).toStrictEqual(error);
    expect(store.errorCount).toEqual(1);
  });

  it('should save worksheet if dirty and not saving', async () => {
    const updateMock = jest
      .spyOn(WorksheetStore.prototype as any, 'updateWorksheet')
      .mockResolvedValue({});
    const { store, worksheetMock } = createWorksheetStore();

    jest.spyOn(store, 'isDirty', 'get').mockReturnValue(true);
    store.serverState = worksheetMock;
    store.uiState = {
      ...worksheetMock,
      name: `new-${worksheetMock.name}`,
    };

    await store.saveWorksheet();
    expect(updateMock).toHaveBeenCalledWith({
      name: store.uiState?.name,
    });

    store.uiState = {
      ...worksheetMock,
      name: `new-${worksheetMock.name}`,
      readOnly: !worksheetMock.readOnly,
      value: `new-${worksheetMock.value}`,
    };

    await store.saveWorksheet();
    expect(updateMock).toHaveBeenCalledWith({
      name: store.uiState?.name,
      readOnly: store.uiState.readOnly,
      value: store.uiState.value,
    });
  });

  test.each([
    [true, false],
    [false, false],
    [true, true],
  ])(
    'should not save worksheet when isDirty is %p, and isSaving is %p',
    async (isSaving, isDirty) => {
      const updateMock = jest
        .spyOn(WorksheetStore.prototype as any, 'updateWorksheet')
        .mockResolvedValue({});
      const { store } = createWorksheetStore();

      jest.spyOn(store, 'isDirty', 'get').mockReturnValue(isDirty);
      store.isSaving = isSaving;

      await store.saveWorksheet();
      expect(updateMock).not.toHaveBeenCalled();
    },
  );

  it('should save new worksheet', async () => {
    jest.useFakeTimers().setSystemTime(new Date(1665302810925));

    const { store, requestMock, worksheetMock } = createWorksheetStore({
      isNew: true,
    });
    const payload = {
      name: worksheetMock.name,
      value: worksheetMock.value,
    };

    expect(store.initNewState).toEqual({
      id: worksheetMock.id,
      name: 'Untitled 2022-10-9 8:06',
      createdBy: '',
      createdOn: 0,
      readOnly: true,
      updatedBy: '',
      updatedOn: 0,
      value: '',
    });

    expect(store.uiState).toBeDefined();

    await store['updateWorksheet'](payload);

    expect(requestMock).toHaveBeenCalledWith({
      url: worksheetApiUrl,
      data: {
        ...payload,
        id: worksheetMock.id,
      },
      method: 'POST',
    });
    expect(store.isNew).toEqual(false);
  });

  it('should update worksheet', async () => {
    const { store, requestMock, worksheetMock } = createWorksheetStore();

    store.uiState = worksheetMock;
    const payload = {
      name: worksheetMock.name,
      value: worksheetMock.value,
      readOnly: worksheetMock.readOnly,
    };

    const updatePromise = store['updateWorksheet'](payload);

    expect(store.isSaving).toBe(true);
    expect(store.isLoading).toBe(false);
    expect(store.loadError).toBeUndefined();
    expect(store.serverState).toBeUndefined();
    expect(requestMock).toHaveBeenCalledWith({
      url: `${worksheetApiUrl}/${worksheetMock.id}`,
      data: payload,
      method: 'PATCH',
    });

    await updatePromise;
    const updateDate = new Date();

    expect(store.isLoading).toBe(false);
    expect(store.isSaving).toBe(false);
    expect(store.isLoaded).toBe(true);
    expect(store.serverState).toStrictEqual(worksheetMock);
    expect(store.lastSaveTime).toStrictEqual(updateDate);
  });

  it('should handle update worksheet error', async () => {
    const error = new Error('update error');
    const { store, worksheetMock } = createWorksheetStore({
      requestMock: jest.fn().mockRejectedValue(error),
    });

    store.uiState = worksheetMock;

    await store['updateWorksheet']({});
    expect(store.serverState).toBeUndefined();
    expect(store.isLoading).toBe(false);
    expect(store.isSaving).toBe(false);
    expect(store.updateError).toStrictEqual(error);
    expect(store.errorCount).toEqual(1);
  });

  it('should save stored state on run', async () => {
    const { store, worksheetMock } = createWorksheetStore({
      clientMock: createClientMock({
        execAsync: jest.fn().mockResolvedValue(txnResultMock),
      }),
    });

    store.uiState = worksheetMock;
    store.storedState = { engineName, databaseName };

    await store.runWorksheet();

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({
        'accId-worksheetId': { engineName, databaseName },
      }),
    );
  });

  it('should run worksheet (fast path)', async () => {
    jest.mocked(getOutputGroups).mockReturnValue(outputGroups);
    const mockOnLoadBaseRelations = jest.fn();
    const mockSelectBottomTab = jest.fn();
    const { store, worksheetMock, clientMock } = createWorksheetStore({
      clientMock: createClientMock({
        execAsync: jest.fn().mockResolvedValue(txnResultMock),
      }),
    });

    store.uiState = worksheetMock;
    store.storedState = { engineName, databaseName };
    store.response = txnResultMock;
    store['syncStore'] = createSyncStoreMock({
      loadBaseRelations: mockOnLoadBaseRelations,
      selectBottomTab: mockSelectBottomTab,
    });

    const runPromise = store.runWorksheet();
    const startedDate = Date.now();

    expect(store.startedAt).toStrictEqual(startedDate);
    expect(store.isRunning).toBe(true);
    expect(store.execError).toBeUndefined();
    expect(store.finishedAt).toBeUndefined();
    expect(store.transactionId).toBeUndefined();
    expect(store['abortController']?.signal.aborted).toBe(false);
    expect(store.response).toBeUndefined();
    expect(clientMock.execAsync).toHaveBeenCalledWith(
      databaseName,
      engineName,
      worksheetMock.value,
      [],
      false,
      [TransactionTags.CONSOLE_USER],
    );
    expect(store['outputGroups']).toStrictEqual(outputGroups);

    await runPromise;

    const finishedDate = Date.now();

    expect(store.isRunning).toBe(false);
    expect(store.finishedAt).toStrictEqual(finishedDate);
    expect(store.response).toStrictEqual(txnResultMock);
    expect(store.editorDiagnostics).toStrictEqual(editorDiagnosticMock);
    expect(store.transactionId).toStrictEqual(txnResultMock.transaction.id);
    expect(mockOnLoadBaseRelations).toHaveBeenCalledWith('databaseName');
    expect(mockSelectBottomTab).toHaveBeenCalledWith('output');
  });

  it('should run worksheet (partial query)', async () => {
    const { store, worksheetMock, clientMock } = createWorksheetStore({
      clientMock: createClientMock({
        execAsync: jest.fn().mockResolvedValue(txnResultMock),
      }),
    });

    const selection = { from: 0, to: 4 } as any;

    store.uiState = worksheetMock;
    store.selection = selection;
    store.storedState = { engineName, databaseName };

    const runPromise = store.runWorksheet();

    expect(clientMock.execAsync).toHaveBeenCalledWith(
      databaseName,
      engineName,
      'work', // <-- selected range was from 0 to 4
      [],
      false,
      [TransactionTags.CONSOLE_USER],
    );

    await runPromise;

    expect(store.lastSelection).toStrictEqual(selection);
  });

  it('should run worksheet (slow path)', async () => {
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest.fn().mockResolvedValue(txnResultMock),
    });
    const { store, clientMock, worksheetMock } = createWorksheetStore({
      clientMock: createClientMock({
        execAsync: jest.fn().mockResolvedValue(txnCompactMock),
      }),
      syncStoreMock,
    });

    store.uiState = worksheetMock;
    store.storedState = { engineName, databaseName };

    const runPromise = store.runWorksheet();

    expect(clientMock.execAsync).toHaveBeenCalledWith(
      databaseName,
      engineName,
      worksheetMock.value,
      [],
      false,
      [TransactionTags.CONSOLE_USER],
    );

    await when(() => store.transactionId === transactionId);

    await waitFor(() =>
      expect(store.transactionId).toStrictEqual(transactionId),
    );
    expect(syncStoreMock.pollTransaction).toHaveBeenCalledWith(
      clientMock,
      transactionId,
      store['abortController']?.signal,
    );

    await runPromise;
    const nowDate = Date.now();

    expect(store.isRunning).toBe(false);
    expect(store.isCancelling).toBe(false);
    expect(store.finishedAt).toStrictEqual(nowDate);
    expect(store.response).toStrictEqual(txnResultMock);
    expect(store.editorDiagnostics).toStrictEqual(editorDiagnosticMock);
  });

  it('should handle run worksheet error (fast path)', async () => {
    const error = new Error('run error');
    const { store, worksheetMock } = createWorksheetStore({
      clientMock: createClientMock({
        execAsync: jest.fn().mockRejectedValue(error),
      }),
    });

    store.uiState = worksheetMock;
    store.storedState = { engineName, databaseName };

    await store.runWorksheet();
    const finishedDate = Date.now();

    expect(store.transactionId).toBeUndefined();
    expect(store.isRunning).toBe(false);
    expect(store.isCancelling).toBe(false);
    expect(store.execError).toStrictEqual(error);
    expect(store.finishedAt).toStrictEqual(finishedDate);
    expect(store.errorCount).toEqual(1);
  });

  it('should handle run worksheet error (slow path)', async () => {
    const error = new Error('run error');
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest.fn().mockRejectedValue(error),
    });
    const { store, worksheetMock } = createWorksheetStore({
      clientMock: createClientMock({
        execAsync: jest.fn().mockResolvedValue(txnCompactMock),
      }),
      syncStoreMock,
    });

    store.uiState = worksheetMock;
    store.storedState = { engineName, databaseName };

    await store.runWorksheet();
    const finishedDate = Date.now();

    expect(store.transactionId).toStrictEqual(transactionId);
    expect(store.isRunning).toBe(false);
    expect(store.isCancelling).toBe(false);
    expect(store.execError).toStrictEqual(error);
    expect(store.finishedAt).toStrictEqual(finishedDate);
  });

  it('should handle polling abort error', async () => {
    const error = new AbortError();
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest.fn().mockRejectedValue(error),
    });
    const { store, worksheetMock } = createWorksheetStore({
      clientMock: createClientMock({
        execAsync: jest.fn().mockResolvedValue(txnCompactMock),
      }),
      syncStoreMock,
    });

    store.uiState = worksheetMock;
    store.storedState = { engineName, databaseName };

    const promise = store.runWorksheet();

    expect(store['abortController']?.signal.aborted).toBe(false);
    expect(store.execError).toBeUndefined();

    await promise;
    expect(store.execError).toBeUndefined();
  });

  test.each([
    ['fast', 'compact'],
    ['fast', 'not compact'],
    ['slow', 'compact'],
    ['slow', 'not compact'],
  ])(
    'should handle system internal error (%p path) (%p transaction).',
    async (pathType, compactType) => {
      const queryResults =
        compactType == 'compact'
          ? abortedTxnResultMockCompact
          : abortedTxnResultMock;
      const clientMock = createClientMock({
        execAsync: jest
          .fn()
          .mockResolvedValue(
            pathType === 'fast' ? queryResults : txnCompactMock,
          ),
        getTransaction: jest
          .fn()
          .mockResolvedValue(abortedTxnResultMock.transaction),
      });
      const syncStoreMock = createSyncStoreMock({
        pollTransaction: jest.fn().mockResolvedValue(queryResults),
      });
      const { store, worksheetMock } = createWorksheetStore({
        clientMock,
        syncStoreMock,
      });

      store.uiState = worksheetMock;
      store.storedState = { engineName, databaseName };

      await store.runWorksheet();
      const finishedDate = Date.now();

      expect(store.transactionId).toStrictEqual(transactionId);
      expect(store.isRunning).toBe(false);
      expect(store.isCancelling).toBe(false);
      expect(store.execError).toStrictEqual({
        name: 'System internal error',
        message:
          'An unexpected exception occurred while executing the transaction.',
      });
      expect(store.finishedAt).toStrictEqual(finishedDate);
    },
  );

  it('should cancel transaction if can cancel and not canceling', async () => {
    const { store, clientMock } = createWorksheetStore();

    jest.spyOn(store, 'canCancel', 'get').mockReturnValue(true);
    store.transactionId = transactionId;
    store.isCancelling = false;

    const cancelPromise = store.cancelTransaction();

    expect(store.isCancelling).toBe(true);
    expect(clientMock.cancelTransaction).toHaveBeenCalledWith(transactionId);

    await cancelPromise;
    expect(store.execError).toBeUndefined();
  });

  test.each([
    [true, true],
    [true, false],
    [false, false],
  ])(
    'should not cancel transaction when isCanceling is %p, and canCancel is %p',
    async (isCanceling, canCancel) => {
      const { store, clientMock } = createWorksheetStore();

      jest.spyOn(store, 'canCancel', 'get').mockReturnValue(canCancel);
      store.isCancelling = isCanceling;
      await store.cancelTransaction();

      expect(clientMock.cancelTransaction).not.toHaveBeenCalled();
    },
  );

  it('should handle cancel transaction error', async () => {
    const error = new Error('cancel error');
    const { store } = createWorksheetStore({
      clientMock: createClientMock({
        cancelTransaction: jest.fn().mockRejectedValue(error),
      }),
    });

    jest.spyOn(store, 'canCancel', 'get').mockReturnValue(true);
    store.transactionId = transactionId;
    store.isCancelling = false;

    await store.cancelTransaction();

    expect(store.execError).toStrictEqual({
      name: 'Internal error',
      message: 'Internal error while cancelling transaction.',
    });
    expect(store.isCancelling).toBe(false);
  });

  it('should set worksheet', () => {
    const worksheetMock = mockWorksheet();
    const { store } = createWorksheetStore({
      worksheetMock,
    });

    jest.spyOn(store, 'analyzeWorksheetDefinitions');

    expect(store.uiState).toBeUndefined();
    expect(store.serverState).toBeUndefined();
    store['setWorksheet'](worksheetMock);
    expect(store.uiState).toStrictEqual(worksheetMock);
    expect(store.serverState).toStrictEqual(worksheetMock);
    expect(store.analyzeWorksheetDefinitions).toHaveBeenCalled();
  });

  it('should get definitions', () => {
    const { store } = createWorksheetStore();
    const autoDefinitionsMock: RelDefinition[] = [
      {
        name: 'test',
        type: 'relation',
        reference: {
          name: store.name,
          type: 'worksheet',
          worksheetId: store.worksheetId,
          from: 1,
          to: 5,
          line: 1,
          column: 1,
        },
      },
    ];

    jest.mocked(getRelDefinitions).mockReturnValue(autoDefinitionsMock);
    store.analyzeWorksheetDefinitions();

    expect(getRelDefinitions).toHaveBeenCalledWith(store.value, {
      name: store.name,
      type: 'worksheet',
      worksheetId: store.worksheetId,
    });
    expect(store.definitions).toStrictEqual(autoDefinitionsMock);
  });

  it('should remember isNew flag', async () => {
    const id = 'foo';
    const store = new WorksheetStore(
      createSyncStoreMock(),
      'accId',
      id,
      createClientMock(),
      jest.fn(),
      true,
    );

    await store.runWorksheet();

    const expectedState = JSON.stringify({
      'accId-foo': { engineName: '', databaseName: '', isNew: true },
    });

    expect(store.isNew).toEqual(true);
    expect(store.name).toContain('Untitled');
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expectedState,
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expectedState,
    );

    const newStore = new WorksheetStore(
      createSyncStoreMock(),
      'accId',
      id,
      createClientMock(),
      jest.fn(),
    );

    expect(newStore.isNew).toEqual(true);
    expect(store.name).toContain('Untitled');
  });

  it('should generate new worksheet name', () => {
    jest.useFakeTimers().setSystemTime(new Date(1665302810925));

    expect(generateName()).toEqual('Untitled 2022-10-9 8:06');
  });

  it('should get gutter highlight range', () => {
    const id = 'foo';
    const store = new WorksheetStore(
      createSyncStoreMock(),
      'accId',
      id,
      createClientMock(),
      jest.fn(),
      true,
    );

    store.uiState = mockWorksheet();
    store['lastUsedValue'] = store.uiState.value;
    store.lastSelection = SelectionRange.fromJSON({
      anchor: 1,
      head: 5,
    });
    expect(store.gutterHighlightRange).toEqual(store.lastSelection);

    store.lastSelection = SelectionRange.fromJSON({
      anchor: 0,
      head: store.value.length,
    });

    expect(store.gutterHighlightRange).toBeUndefined();
  });

  it('should set not found', async () => {
    const requestMock = jest
      .fn()
      .mockRejectedValue(new SvcError('not found', SvcErrorCode.NOT_FOUND));
    const { store } = createWorksheetStore({
      requestMock,
    });

    expect(store.isNotFound).toBe(false);
    await store.loadWorksheet();
    expect(store.isNotFound).toBe(true);

    requestMock.mockResolvedValue(mockWorksheet());

    await store.loadWorksheet();
    expect(store.isNotFound).toBe(false);
  });
});
