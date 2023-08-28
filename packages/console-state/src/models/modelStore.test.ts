import { localStorage, sessionStorage } from '@shopify/jest-dom-mocks';
import { waitFor } from '@testing-library/react';

import { SelectionRange } from '@relationalai/code-editor';
import {
  getRelDefinitions,
  RelDefinition,
} from '@relationalai/editor-extensions';
import {
  TransactionAsyncCompact,
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import { Diagnostic, downloadString, plainToArrow } from '@relationalai/utils';

import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import {
  checkSystemInternals,
  v2InstallModelAsync,
  v2loadModel,
} from '../utils/sdkUtils';
import { Model, ModelStore, STORAGE_KEY } from './modelStore';

const accountId = 'accountId';
const engineName = 'engineName';
const databaseId = 'bdId';
const transactionId = 'transactionId';
const modelMock: Model = {
  name: 'foo/bar/modelName',
  value: 'modelValue',
  errorCount: 4,
  isLocal: false,
};
const definitionsMock: RelDefinition[] = [
  {
    name: 'test',
    type: 'relation',
    reference: {
      name: modelMock.name,
      type: 'model',
      databaseName: databaseId,
      from: 1,
      to: 2,
      line: 1,
      column: 1,
    },
  },
  {
    name: 'test:name',
    type: 'relation',
    reference: {
      name: modelMock.name,
      type: 'model',
      databaseName: databaseId,
      from: 1,
      to: 2,
      line: 1,
      column: 1,
    },
  },
];
const emptyModelMock: Model = {
  name: 'foo/bar/modelName',
  value: '',
  errorCount: 0,
  isLocal: true,
};
const txnResultMock: TransactionAsyncResult = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
    {
      relationId: '/:rel/:catalog/:diagnostic/:message/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['message 1', 'message 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:severity/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['error', 'error'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:code/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['PARSE_ERROR', 'UNBOUND_VARIABLE'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:report/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['report 1', 'report 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:model/Int64/String',
      columns: [[BigInt(2)], [modelMock.name]],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:start/:line/Int64/Int64/Int64',
      columns: [[BigInt(2)], [1], [1]],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:start/:character/Int64/Int64/Int64',
      columns: [[BigInt(2)], [1], [1]],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:end/:line/Int64/Int64/Int64',
      columns: [[BigInt(2)], [1], [1]],
    },
    {
      relationId:
        '/:rel/:catalog/:diagnostic/:range/:end/:character/Int64/Int64/Int64',
      columns: [[BigInt(2)], [1], [5]],
    },
    {
      relationId: '/:output/:__model__/String/String',
      columns: [[modelMock.name], [modelMock.value]],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#constaint#0',
      columns: [[[BigInt(123), BigInt(0)]]],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#foo#0',
      columns: [[[BigInt(456), BigInt(0)]]],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:report/HashValue/String',
      columns: [
        [
          [BigInt(123), BigInt(0)],
          [BigInt(456), BigInt(0)],
        ],
        ['report 1', 'report 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:model/HashValue/String',
      columns: [[[BigInt(456), BigInt(0)]], [modelMock.name]],
    },
  ]),
};
const emptyTxnResultMock: TransactionAsyncResult = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
    { relationId: '/:output/:foo/Int32', columns: [[1]] },
  ]),
};
const diagnosticsMock: Diagnostic[] = [
  {
    model: modelMock.name,
    report: 'report 2',
    message: 'message 2',
    code: 'UNBOUND_VARIABLE',
    severity: 'error',
    range: [
      {
        start: { line: 1, character: 1 },
        end: { line: 1, character: 5 },
      },
    ],
  },
  {
    code: 'PARSE_ERROR',
    message: 'message 1',
    report: 'report 1',
    severity: 'error',
  },
];

const editorDiagnosticsMock = [
  {
    from: 0,
    to: 5,
    severity: 'error',
    message: '⚠ UNBOUND_VARIABLE\n\tmessage 2',
    original: diagnosticsMock[0],
  },
];

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
  },
  results: plainToArrow([
    {
      relationId: '/:rel/:catalog/:diagnostic/:message/Int64/String',
      columns: [[BigInt(1)], ['MESSAGE 1']],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:severity/Int64/String',
      columns: [[BigInt(1)], ['exception']],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:code/Int64/String',
      columns: [[BigInt(1)], ['PARSE_ERROR']],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:report/Int64/String',
      columns: [[BigInt(1)], ['report 1']],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:model/Int64/String',
      columns: [[BigInt(1)], [modelMock.name]],
    },
    {
      relationId: '/:output/:__model__/String/String',
      columns: [[modelMock.name], ['abortedModelValue']],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#constaint#0',
      columns: [[[BigInt(123), BigInt(0)]]],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#foo#0',
      columns: [[[BigInt(456), BigInt(0)]]],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:report/HashValue/String',
      columns: [
        [
          [BigInt(123), BigInt(0)],
          [BigInt(456), BigInt(0)],
        ],
        ['report 1', 'report aborted'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:model/HashValue/String',
      columns: [[[BigInt(456), BigInt(0)]], [modelMock.name]],
    },
  ]),
};

jest.mock('@relationalai/utils', () => {
  const original = jest.requireActual('@relationalai/utils');

  return {
    ...original,
    downloadString: jest.fn(),
  };
});

jest.mock('../utils/sdkUtils');
jest.mock('@relationalai/editor-extensions');

const v2loadModelMock = jest.mocked(v2loadModel);
const v2InstallModelAsyncMock = jest.mocked(v2InstallModelAsync);
const downloadStringMock = jest.mocked(downloadString);

const createModelStore = (
  editorValue?: string,
  clientMock = createClientMock(),
  syncStoreMock = createSyncStoreMock(),
) => {
  const store = new ModelStore(
    syncStoreMock,
    accountId,
    clientMock,
    databaseId,
    modelMock.name,
  );

  if (editorValue) {
    store['editorValue'] = editorValue;
    store['lastUsedValue'] = editorValue;
  }

  return store;
};

describe('model store', () => {
  afterEach(() => {
    localStorage.restore();
    sessionStorage.restore();
  });

  it('should get model', () => {
    const store = createModelStore(modelMock.value);

    store.response = txnResultMock;
    expect(store.model).toEqual(modelMock);
  });

  it('should get diagnostics', () => {
    const store = createModelStore(modelMock.value);

    store.response = txnResultMock;

    expect(store.diagnostics).toEqual(diagnosticsMock);

    expect(store.editorDiagnostics).toEqual(editorDiagnosticsMock);
  });

  it('should get diagnostics with aborted response', () => {
    const store = createModelStore(modelMock.value);

    store.response = txnResultMock;
    store.abortedResponse = abortedTxnResultMock;

    expect(store.diagnostics).toEqual([
      {
        model: modelMock.name,
        report: 'report 1',
        message: 'MESSAGE 1',
        code: 'PARSE_ERROR',
        severity: 'exception',
      },
    ]);

    expect(store.editorDiagnostics).toEqual([]);
  });

  it('should empty diagnostics when editor value change', () => {
    const store = createModelStore(modelMock.value);

    store.response = txnResultMock;
    store.setValue(modelMock.value);
    store['lastUsedValue'] = store.value;

    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticsMock);

    store.setValue(`new-${store.value}`);

    expect(store.diagnostics).toEqual([]);
    expect(store.editorDiagnostics).toEqual([]);
  });

  it('should empty diagnostics and IC violations when saving', () => {
    const store = createModelStore(modelMock.value);

    store.response = txnResultMock;
    store.setValue(modelMock.value);
    store['lastUsedValue'] = store.value;

    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticsMock);
    expect(store.icViolations).toEqual([
      {
        decl_id: ':rel-query-action##123#constaint#0',
        output: [],
        report: 'report 1',
      },
      {
        decl_id: ':rel-query-action##123#foo#0',
        model: modelMock.name,
        report: 'report 2',
        output: [],
      },
    ]);

    store.isSaving = true;

    expect(store.diagnostics).toEqual([]);
    expect(store.editorDiagnostics).toEqual([]);
    expect(store.icViolations).toEqual([]);
  });

  it('should empty diagnostics and IC violations when cancelling', () => {
    const store = createModelStore(modelMock.value);

    store.response = txnResultMock;
    store.setValue(modelMock.value);
    store['lastUsedValue'] = store.value;

    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticsMock);
    expect(store.icViolations).toEqual([
      {
        decl_id: ':rel-query-action##123#constaint#0',
        output: [],
        report: 'report 1',
      },
      {
        decl_id: ':rel-query-action##123#foo#0',
        model: modelMock.name,
        report: 'report 2',
        output: [],
      },
    ]);

    store.isCancelling = true;

    expect(store.diagnostics).toEqual([]);
    expect(store.editorDiagnostics).toEqual([]);
    expect(store.icViolations).toEqual([]);
  });

  it('should get ic violations', () => {
    const store = createModelStore();

    store.response = txnResultMock;

    expect(store.icViolations).toEqual([
      {
        decl_id: ':rel-query-action##123#constaint#0',
        output: [],
        report: 'report 1',
      },
      {
        decl_id: ':rel-query-action##123#foo#0',
        model: modelMock.name,
        report: 'report 2',
        output: [],
      },
    ]);
  });

  it('should get icViolations with aborted response', () => {
    const store = createModelStore();

    store.response = txnResultMock;
    store.abortedResponse = abortedTxnResultMock;

    expect(store.icViolations).toEqual([
      {
        decl_id: ':rel-query-action##123#constaint#0',
        output: [],
        report: 'report 1',
      },
      {
        decl_id: ':rel-query-action##123#foo#0',
        model: modelMock.name,
        report: 'report aborted',
        output: [],
      },
    ]);
  });

  it('should get error count', () => {
    const store = createModelStore();

    store.response = emptyTxnResultMock;
    expect(store.errorCount).toEqual(0);

    store.response = txnResultMock;
    store['editorValue'] = modelMock.value;
    store['lastUsedValue'] = modelMock.value;
    expect(store.errorCount).toEqual(4);

    store['_error'] = new Error('foo');
    expect(store.errorCount).toEqual(5);
  });

  it('should get filename', () => {
    const store = createModelStore();

    expect(store.filename).toEqual('modelName');
  });

  it('should get isLocal', () => {
    const store = createModelStore();

    expect(store.isLocal).toEqual(false);

    store.response = txnResultMock;

    expect(store.isLocal).toEqual(false);

    store.response = emptyTxnResultMock;

    expect(store.isLocal).toEqual(true);
  });

  it('should get isDirty', () => {
    const store = createModelStore(modelMock.value);

    store.response = txnResultMock;

    expect(store.isDirty).toEqual(false);

    store.setValue(`new-${store.value}`);

    expect(store.isDirty).toEqual(true);
  });

  it('should get canCancel', () => {
    const store = createModelStore();

    expect(store.canCancel).toEqual(false);

    store.isSaving = true;
    store.inflightTransactionId = transactionId;

    expect(store.canCancel).toEqual(true);
  });

  it('should load model', async () => {
    const store = createModelStore();

    store.storedState.engineName = 'foo';

    expect(store.model).toEqual({ ...emptyModelMock, isLocal: false });
    expect(store.value).toEqual('');

    v2loadModelMock.mockResolvedValue(txnResultMock);

    store.loadModel();

    expect(store.isLoading).toBeTruthy();

    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.error).toBeUndefined();
    expect(store.model).toEqual(modelMock);
    expect(store.value).toEqual(modelMock.value);
    expect(store.response).toEqual(txnResultMock);
    expect(store.diagnostics).toEqual(diagnosticsMock);
  });

  it('should not load model when engine not selected', () => {
    const store = createModelStore();
    const mockOnLoadModel = jest.fn();

    v2loadModelMock.mockImplementation(mockOnLoadModel);

    store.loadModel();

    expect(mockOnLoadModel).not.toHaveBeenCalled();
  });

  it('should handle error when loading model', async () => {
    const store = createModelStore();

    store.storedState.engineName = 'foo';

    expect(store.model).toEqual({ ...emptyModelMock, isLocal: false });

    v2loadModelMock.mockRejectedValue(new Error('an error'));

    store.loadModel();

    expect(store.isLoading).toBeTruthy();

    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.error?.message).toEqual('an error');
    expect(store.model).toEqual({
      ...emptyModelMock,
      errorCount: 1,
      isLocal: false,
    });
  });

  it('should install model (fast path)', async () => {
    const store = createModelStore();

    store.response = emptyTxnResultMock;

    v2InstallModelAsyncMock.mockResolvedValue(txnResultMock);

    store.installModel();

    expect(store.isSaving).toEqual(true);
    expect(store.inflightTransactionId).toBeUndefined();

    await waitFor(() => expect(store.isSaving).toEqual(false));
    expect(store.response).toEqual(txnResultMock);
    expect(store.model).toEqual(modelMock);
    expect(store.error).toBeUndefined();
    expect(store.diagnostics).toEqual(diagnosticsMock);
    expect(store.editorDiagnostics).toEqual(editorDiagnosticsMock);
  });

  it('should handle error when installing model(fast path)', async () => {
    const store = createModelStore();

    store.response = emptyTxnResultMock;

    v2InstallModelAsyncMock.mockRejectedValue(new Error('an error'));

    store.installModel();

    expect(store.isSaving).toEqual(true);
    expect(store.inflightTransactionId).toBeUndefined();

    await waitFor(() => expect(store.isSaving).toEqual(false));
    expect(store.response).toEqual(emptyTxnResultMock);
    expect(store.model).toEqual({ ...emptyModelMock, errorCount: 1 });
    expect(store.error?.message).toEqual('an error');
    expect(store.inflightTransactionId).toBeUndefined();
  });

  it('should install model (slow path)', async () => {
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createModelStore(undefined, undefined, syncStoreMock);

    store.response = emptyTxnResultMock;
    store.isCancelling = true;
    v2InstallModelAsyncMock.mockResolvedValue(txnCompactMock);

    store.installModel();

    await waitFor(() => expect(store.isSaving).toEqual(false));
    expect(store.isCancelling).toEqual(false);
    expect(store.response).toEqual(txnResultMock);
    expect(store.model).toEqual(modelMock);
    expect(store.error).toBeUndefined();
    expect(store.inflightTransactionId).toBeUndefined();
  });

  it('should handle error when installing model (slow path)', async () => {
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest.fn().mockRejectedValue(new Error('an error')),
    });
    const store = createModelStore(undefined, undefined, syncStoreMock);

    store.response = emptyTxnResultMock;
    v2InstallModelAsyncMock.mockResolvedValue(txnCompactMock);

    store.installModel();

    expect(store.isSaving).toEqual(true);

    await waitFor(() => expect(store.isSaving).toEqual(false));
    await waitFor(() => expect(store.response).toEqual(emptyTxnResultMock));
    expect(store.model).toEqual({ ...emptyModelMock, errorCount: 1 });
    expect(store.error?.message).toEqual('an error');
    expect(store.inflightTransactionId).toEqual(transactionId);
  });

  it('should cancel install model', async () => {
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest
        .fn()
        .mockReturnValue(
          new Promise(resolve => setTimeout(() => resolve(txnResultMock), 100)),
        ),
    });
    const clientMock = createClientMock();
    const store = createModelStore(undefined, clientMock, syncStoreMock);

    store.response = emptyTxnResultMock;
    v2InstallModelAsyncMock.mockReturnValue(
      new Promise(resolve => {
        resolve(txnCompactMock);
        setTimeout(() => store.cancelInstallModel());
      }),
    );

    store.installModel();

    await waitFor(() =>
      expect(clientMock.cancelTransaction).toHaveBeenCalled(),
    );
    await waitFor(() => expect(store.canCancel).toEqual(false));
    expect(store.isCancelling).toEqual(false);
  });

  it('should export model', async () => {
    const store = createModelStore();

    store.response = txnResultMock;

    store.exportModel();

    await waitFor(() => {
      expect(downloadStringMock).toHaveBeenCalledWith(
        modelMock.value,
        'text/plain',
        `${modelMock.name}.rel`,
      );
    });
  });

  it('should set value', () => {
    const store = createModelStore();

    store.response = emptyTxnResultMock;

    expect(store.value).toEqual('');
    expect(store.model.value).toEqual('');

    store.setValue('foo');

    expect(store.value).toEqual('foo');
    expect(store.model.value).toEqual('');
  });

  it('should set selection', () => {
    const store = createModelStore();

    store.response = emptyTxnResultMock;

    expect(store.selection).toBeUndefined();

    const selection = SelectionRange.fromJSON({ anchor: 0, head: 3 });

    store.setSelection(selection);

    expect(store.selection).toEqual(selection);
  });

  it('should set name', () => {
    const store = createModelStore();

    expect(store.name).toEqual(modelMock.name);

    store.setName('test1');

    expect(store.name).toEqual('test1');
  });

  it('should set response', () => {
    const store = createModelStore();

    jest.spyOn(store, 'analyzeModelCompletions');
    store.setResponse(txnResultMock, false);

    expect(store.response).toEqual(txnResultMock);
    expect(store.value).toEqual(modelMock.value);
    expect(store.analyzeModelCompletions).toHaveBeenCalled();
  });

  it('should set installing completed response', () => {
    const store = createModelStore();

    store.abortedResponse = abortedTxnResultMock;

    store.setResponse(txnResultMock, true);

    expect(store.abortedResponse).toBeUndefined();
    expect(store.response).toEqual(txnResultMock);
  });

  it('should override value if not dirty', () => {
    const store = createModelStore();

    store.setResponse(txnResultMock, false);

    expect(store.value).toEqual(modelMock.value);
    expect(store.model.value).toEqual(modelMock.value);

    const newTxnMock: TransactionAsyncResult = {
      transaction: {
        id: 'foo',
        state: TransactionAsyncState.COMPLETED,
      },
      results: plainToArrow([
        {
          relationId: '/:output/:__model__/String/String',
          columns: [[store.name], ['foo']],
        },
      ]),
    };

    store.setResponse(newTxnMock, false);

    expect(store.value).toEqual('foo');
    expect(store.model.value).toEqual('foo');
  });

  it('should not override value if dirty', () => {
    const store = createModelStore();

    store.setResponse(txnResultMock, false);

    expect(store.value).toEqual(modelMock.value);
    expect(store.model.value).toEqual(modelMock.value);

    const newTxnMock: TransactionAsyncResult = {
      transaction: {
        id: 'foo',
        state: TransactionAsyncState.COMPLETED,
      },
      results: plainToArrow([
        {
          relationId: '/:output/:__model__/String/String',
          columns: [[store.name], ['foo']],
        },
      ]),
    };

    store.setValue('dirty');
    store.setResponse(newTxnMock, false);

    expect(store.value).toEqual('dirty');
    expect(store.model.value).toEqual('foo');
  });

  it('should set installing aborted response', () => {
    const store = createModelStore();

    store.response = txnResultMock;

    store.setResponse(abortedTxnResultMock, true);

    expect(store.abortedResponse).toEqual(abortedTxnResultMock);
    expect(store.response).toEqual(txnResultMock);
  });

  it('should analyze model completions', () => {
    jest.mocked(getRelDefinitions).mockReturnValue(definitionsMock);
    const store = createModelStore();

    store.analyzeModelCompletions();

    expect(getRelDefinitions).toHaveBeenCalledWith(store.value, {
      databaseName: store.databaseId,
      name: modelMock.name,
      type: 'model',
    });
    expect(store.definitions).toEqual(definitionsMock);
  });

  it('should set engine name', () => {
    const store = createModelStore();

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(store.engineName).toEqual('');

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
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).toHaveBeenNthCalledWith(
      2,
      STORAGE_KEY,
      JSON.stringify({
        test: 'something',
        'accountId-bdId-foo/bar/modelName': {
          engineName: 'foo',
        },
      }),
    );
  });

  it('should read stored state from session storage', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-foo/bar/modelName': {
          engineName: 'foo',
        },
      }),
    );
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-foo/bar/modelName': {
          engineName: 'testEngine',
        },
      }),
    );

    const store = createModelStore();

    expect(store.engineName).toEqual('foo');
  });

  it('should read stored state from local storage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-foo/bar/modelName': {
          engineName: 'testEngine',
        },
      }),
    );

    const store = createModelStore();

    expect(store.engineName).toEqual('testEngine');
  });

  it('should save stored state on installModel', async () => {
    const store = createModelStore();

    v2InstallModelAsyncMock.mockResolvedValue(txnResultMock);
    store.storedState = { engineName };

    await store.installModel();

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-foo/bar/modelName': { engineName },
      }),
    );
  });

  it('should check system internal errors', async () => {
    const store = createModelStore();

    v2InstallModelAsyncMock.mockResolvedValue(abortedTxnResultMock);
    v2loadModelMock.mockResolvedValue(txnResultMock);
    store.storedState = { engineName };
    const error = new Error('System internal error');

    jest.mocked(checkSystemInternals).mockRejectedValue(error);

    await store.installModel();

    expect(store.abortedResponse).toEqual(abortedTxnResultMock);
    expect(store.response).toBeUndefined();
    expect(store.error).toEqual(error);

    await store.loadModel();

    expect(store.abortedResponse).toEqual(abortedTxnResultMock);
    expect(store.response).toEqual(txnResultMock);
    expect(store.error).toEqual(error);
  });
});
