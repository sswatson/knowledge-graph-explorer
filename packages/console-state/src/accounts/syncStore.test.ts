import {
  AbortError,
  ApiError,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';

import { createClientMock } from '../clientMock';
import {
  createBaseRelationListStoreMock,
  mockBaseRelation,
} from '../database/baseRelationListStoreMock';
import {
  createDatabaseListStoreMock,
  mockDatabase,
} from '../database/databaseListStoreMock';
import { createEditorStoreMock } from '../editor/EditorStoreMock';
import { createModelListStoreMock } from '../models/modelListStoreMock';
import { createModelStoreMock } from '../models/modelStoreMock';
import { createAccountStoreMock } from './accountStoreMock';
import { SyncStore } from './syncStore';

describe('SyncStore', () => {
  it('should close worksheet tab', () => {
    const mockOnCloseWorksheetTab = jest.fn();
    const editorStore = createEditorStoreMock({
      closeWorksheetTab: mockOnCloseWorksheetTab,
    });
    const accountStore = createAccountStoreMock({
      getEditorStore: () => editorStore,
    });
    const store = new SyncStore(accountStore);

    store.closeWorksheetTab('foo');

    expect(mockOnCloseWorksheetTab).toHaveBeenCalledWith('foo');
  });

  it('should close model tab', () => {
    const mockOnCloseModelTab = jest.fn();
    const editorStore = createEditorStoreMock({
      closeModelTab: mockOnCloseModelTab,
    });
    const accountStore = createAccountStoreMock({
      getEditorStore: () => editorStore,
    });
    const store = new SyncStore(accountStore);

    store.closeModelTab('foo', 'bar');

    expect(mockOnCloseModelTab).toHaveBeenCalledWith('foo', 'bar');
  });

  it('should rename model tab', () => {
    const mockOnRenameModelTab = jest.fn();
    const editorStore = createEditorStoreMock({
      renameModelTab: mockOnRenameModelTab,
    });
    const accountStore = createAccountStoreMock({
      getEditorStore: () => editorStore,
    });
    const store = new SyncStore(accountStore);

    store.renameModelTab('foo', 'bar', 'baz');

    expect(mockOnRenameModelTab).toHaveBeenCalledWith('foo', 'bar', 'baz');
  });

  it('should load base relations and force reload base relation stores', () => {
    const mockOnLoadBaseRelations = jest.fn();

    const baseRelationListStore = createBaseRelationListStoreMock({
      loadBaseRelations: mockOnLoadBaseRelations,
    });
    const accountStore = createAccountStoreMock({
      getBaseRelationListStore: () => baseRelationListStore,
    });
    const store = new SyncStore(accountStore);

    store.loadBaseRelations('foo');

    expect(mockOnLoadBaseRelations).toHaveBeenCalled();
  });

  it('should get database list', () => {
    const databasesMock = [
      mockDatabase({
        id: 'db1',
        name: 'dbName1',
      }),
      mockDatabase({
        id: 'db2',
        name: 'dbName2',
      }),
    ];

    const databaseListStoreMock = createDatabaseListStoreMock({
      databases: databasesMock,
      isLoading: false,
      error: new Error('dummy'),
      isLoaded: true,
    });

    const store = new SyncStore(
      createAccountStoreMock({
        getDatabaseListStore: () => databaseListStoreMock,
      }),
    );

    expect(store.getDatabasesList(false)).toEqual({
      databases: databasesMock,
      error: databaseListStoreMock.error,
      isLoading: false,
    });
    expect(databaseListStoreMock.loadDatabases).not.toBeCalled();
  });

  it('should load database list if not loaded', () => {
    const databaseListStoreMock = createDatabaseListStoreMock({
      isLoaded: false,
    });

    const store = new SyncStore(
      createAccountStoreMock({
        getDatabaseListStore: () => databaseListStoreMock,
      }),
    );

    store.getDatabasesList(false);
    expect(databaseListStoreMock.loadDatabases).toBeCalledTimes(1);
  });

  it('should not load database list error is defined', () => {
    const databaseListStoreMock = createDatabaseListStoreMock({
      isLoaded: false,
      error: new Error('dummy'),
    });

    const store = new SyncStore(
      createAccountStoreMock({
        getDatabaseListStore: () => databaseListStoreMock,
      }),
    );

    store.getDatabasesList(false);
    expect(databaseListStoreMock.loadDatabases).not.toBeCalled();
  });

  it('should load database list with force reload true', () => {
    const databaseListStoreMock = createDatabaseListStoreMock({
      isLoaded: false,
    });

    const store = new SyncStore(
      createAccountStoreMock({
        getDatabaseListStore: () => databaseListStoreMock,
      }),
    );

    store.getDatabasesList(true);
    expect(databaseListStoreMock.loadDatabases).toBeCalledTimes(1);
  });

  it('should get base relations', () => {
    const mockBaseRelationsList = [
      mockBaseRelation({ name: 'relation1' }),
      mockBaseRelation({ name: 'relation2' }),
    ];

    const baseRelationListStoreMock = createBaseRelationListStoreMock({
      baseRelations: mockBaseRelationsList,
      isLoading: false,
      error: new Error('dummy'),
      isLoaded: true,
      engine: 'dummy-engine',
    });
    const accountStore = createAccountStoreMock({
      getBaseRelationListStore: () => baseRelationListStoreMock,
    });
    const store = new SyncStore(accountStore);

    const {
      baseRelations: baseRelationList,
      isLoading,
      error,
    } = store.getBaseRelationsList('foo', baseRelationListStoreMock.engine);

    expect(baseRelationList).toEqual(mockBaseRelationsList);
    expect(isLoading).toEqual(false);
    expect(error).toEqual(baseRelationListStoreMock.error);
  });

  it('should load base relations when isLoaded is false', () => {
    const baseRelationListStoreMock = createBaseRelationListStoreMock({
      isLoaded: false,
    });

    const accountStore = createAccountStoreMock({
      getBaseRelationListStore: () => baseRelationListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getBaseRelationsList('foo', baseRelationListStoreMock.engine);

    expect(baseRelationListStoreMock.loadBaseRelations).toBeCalledTimes(1);
  });

  it('should not load base relations when error is defined', () => {
    const baseRelationListStoreMock = createBaseRelationListStoreMock({
      isLoaded: false,
      error: new Error('dummy error'),
    });

    const accountStore = createAccountStoreMock({
      getBaseRelationListStore: () => baseRelationListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getBaseRelationsList('foo', baseRelationListStoreMock.engine);

    expect(baseRelationListStoreMock.loadBaseRelations).not.toBeCalled();
  });

  it('should load base relations with different engine', () => {
    const baseRelationListStoreMock = createBaseRelationListStoreMock({
      isLoaded: true,
      engine: 'engine-1',
    });

    const accountStore = createAccountStoreMock({
      getBaseRelationListStore: () => baseRelationListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getBaseRelationsList('foo', 'engine-2');

    expect(baseRelationListStoreMock.setEngine).toBeCalledWith('engine-2');
    expect(baseRelationListStoreMock.loadBaseRelations).toBeCalledTimes(1);
  });

  it('should load base relations with force reload true', () => {
    const baseRelationListStoreMock = createBaseRelationListStoreMock({
      isLoaded: true,
    });

    const accountStore = createAccountStoreMock({
      getBaseRelationListStore: () => baseRelationListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getBaseRelationsList('foo', baseRelationListStoreMock.engine, true);

    expect(baseRelationListStoreMock.loadBaseRelations).toBeCalledTimes(1);
  });

  it('should get models', () => {
    const modelsMock = [
      {
        name: 'model1',
        value: 'value1',
      },
      {
        name: 'model2',
        value: 'value2',
      },
    ];

    const modelListStoreMock = createModelListStoreMock({
      models: modelsMock,
      isLoading: false,
      error: new Error('dummy'),
      isLoaded: true,
      engine: 'dummy-engine',
    });
    const accountStore = createAccountStoreMock({
      getModelListStore: () => modelListStoreMock,
    });
    const store = new SyncStore(accountStore);

    const { models, isLoading, error } = store.getModelsList(
      'foo',
      modelListStoreMock.engine,
    );

    expect(models).toEqual(modelsMock);
    expect(isLoading).toEqual(false);
    expect(error).toEqual(modelListStoreMock.error);
  });

  it('should load models when isLoaded is false', () => {
    const modelListStoreMock = createModelListStoreMock({
      isLoaded: false,
    });

    const accountStore = createAccountStoreMock({
      getModelListStore: () => modelListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getModelsList('foo', modelListStoreMock.engine);

    expect(modelListStoreMock.listModels).toBeCalledTimes(1);
  });

  it('should not models when error is defined', () => {
    const modelListStoreMock = createModelListStoreMock({
      isLoaded: false,
      error: new Error('an error'),
    });

    const accountStore = createAccountStoreMock({
      getModelListStore: () => modelListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getModelsList('foo', modelListStoreMock.engine);

    expect(modelListStoreMock.listModels).not.toBeCalled();
  });

  it('should reload models with different engine', () => {
    const modelListStoreMock = createModelListStoreMock({
      isLoaded: false,
      engine: 'engine-1',
    });

    const accountStore = createAccountStoreMock({
      getModelListStore: () => modelListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getModelsList('foo', 'engine-2');

    expect(modelListStoreMock.setEngine).toBeCalledWith('engine-2');
    expect(modelListStoreMock.listModels).toBeCalledTimes(1);
  });

  it('should load models with force reload true', () => {
    const modelListStoreMock = createModelListStoreMock({
      isLoaded: true,
    });

    const accountStore = createAccountStoreMock({
      getModelListStore: () => modelListStoreMock,
    });
    const store = new SyncStore(accountStore);

    store.getModelsList('foo', modelListStoreMock.engine, true);

    expect(modelListStoreMock.listModels).toBeCalledTimes(1);
  });

  it('should close base relation tab', () => {
    const mockCloseBaseRelationTab = jest.fn();
    const editorStore = createEditorStoreMock({
      closeBaseRelationTab: mockCloseBaseRelationTab,
    });
    const accountStore = createAccountStoreMock({
      getEditorStore: () => editorStore,
    });
    const store = new SyncStore(accountStore);

    store.closeBaseRelationTab('databaseName', 'baseRelationName');

    expect(mockCloseBaseRelationTab).toHaveBeenCalledWith(
      'databaseName',
      'baseRelationName',
    );
  });

  it('should reset base relation store', () => {
    const mockDeleteBRStore = jest.fn();

    const accountStore = createAccountStoreMock({
      getBaseRelationListStore: () =>
        createBaseRelationListStoreMock({
          deleteBaseRelationStore: mockDeleteBRStore,
        }),
    });
    const store = new SyncStore(accountStore);

    store.deleteBaseRelationStore('databaseName', 'baseRelationName');

    expect(mockDeleteBRStore).toHaveBeenCalledWith('baseRelationName');
  });

  it('should select bottom tab', () => {
    const mockSelectBottomTab = jest.fn();
    const editorStore = createEditorStoreMock({
      selectBottomTab: mockSelectBottomTab,
    });
    const accountStore = createAccountStoreMock({
      getEditorStore: () => editorStore,
    });
    const store = new SyncStore(accountStore);

    store.selectBottomTab('output');
    expect(mockSelectBottomTab).toHaveBeenCalledWith('output');
  });

  it('should poll transaction', async () => {
    const clientMock = createClientMock({
      getTransaction: jest.fn().mockResolvedValue({
        state: TransactionAsyncState.COMPLETED,
      }),
      getTransactionResults: jest.fn().mockResolvedValue([]),
    });
    const store = new SyncStore(createAccountStoreMock());
    const txnId1 = 'txnId1';
    const txnId2 = 'txnId2';

    const promise1 = store.pollTransaction(clientMock, txnId1);
    const promise2 = store.pollTransaction(clientMock, txnId1);
    const promise3 = store.pollTransaction(clientMock, txnId2);

    expect(Object.keys(store['txnPollCache'])).toEqual([txnId1, txnId2]);

    await Promise.all([promise1, promise2, promise3]);

    expect(Object.keys(store['txnPollCache'])).toEqual([]);
  });

  test.each([
    [new ApiError('api_error', '500', '', {} as any), 'api_error'],
    [new AbortError('abort_error'), 'abort_error'],
    [
      new Error('Failed to read server response.'),
      'Failed to read server response.',
    ],
  ])('should poll with ignoring errors', async (error, message) => {
    const txnId = 'txnId';

    jest.useFakeTimers({
      now: 0,
    });
    let callNumber = 0;

    const mockOnPollTransaction = jest.fn().mockImplementation(() => {
      if (callNumber === 1) {
        throw error;
      }

      callNumber++;

      throw new Error('generic error');
    });
    const store = new SyncStore(createAccountStoreMock());
    const client = createClientMock({
      pollTransaction: mockOnPollTransaction,
    });

    const promise = store.pollTransaction(client, txnId);

    jest.advanceTimersByTime(5000);

    expect(mockOnPollTransaction).toHaveBeenCalledTimes(
      message === 'Failed to read server response.' ? 5 : 2,
    );

    try {
      await promise;
    } catch (error: any) {
      expect(error.message).toEqual(message);
    }
  });

  it('should get isDatabaseModelDirty from the modelStore', () => {
    const modelsMock = [
      {
        name: 'model1',
        value: 'foo',
      },
    ];

    const modelListStoreMock = createModelListStoreMock({
      models: modelsMock,
      modelStores: {
        foo: createModelStoreMock({
          isDirty: true,
        }),
      },
      isLoading: false,
      isLoaded: true,
      databaseId: 'db1',
      engine: 'dummy-engine',
    });

    const accountStore = createAccountStoreMock({
      getModelListStore: () => modelListStoreMock,
    });
    const store = new SyncStore(accountStore);

    expect(store.isDatabaseModelDirty('db1', 'foo')).toBeTruthy();
  });

  it('should get flags', () => {
    const accountStore = createAccountStoreMock({
      context: {
        accountId: '',
        getToken: jest.fn(),
        client: createClientMock(),
        flags: { foo: true },
        userId: '',
      },
    });
    const store = new SyncStore(accountStore);

    expect(store.flags).toEqual({ foo: true });
  });
});
