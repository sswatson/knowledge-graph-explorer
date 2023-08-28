import { waitFor } from '@testing-library/react';

import { RelDefinition } from '@relationalai/editor-extensions';
import {
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import { plainToArrow } from '@relationalai/utils';

import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import {
  v2DeleteModels,
  v2InstallModels,
  v2ListModels,
  v2RenameModel,
} from '../utils/sdkUtils';
import { ModelListStore } from './modelListStore';
import { createModelStoreMock } from './modelStoreMock';

const databaseId = 'bdId';
const transactionId = 'transactionId';
const accountId = 'accountId';

const txnResultMock: TransactionAsyncResult = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
    {
      relationId: '/:output/:__model__/String/String',
      columns: [
        ['foo', 'bar'],
        ['fooValue', 'barValue'],
      ],
    },
  ]),
};

jest.mock('../utils/sdkUtils');

const v2ListModelsMock = jest.mocked(v2ListModels);
const v2DeleteModelsMock = jest.mocked(v2DeleteModels);
const v2RenameModelMock = jest.mocked(v2RenameModel);
const v2InstallModelsMock = jest.mocked(v2InstallModels);

const createModelListStore = () => {
  const clientMock = createClientMock();
  const modelListStore = new ModelListStore(
    createSyncStoreMock(),
    accountId,
    clientMock,
    databaseId,
  );

  return modelListStore;
};

describe('model list store', () => {
  it('should get model store', () => {
    const store = createModelListStore();

    const modelStore = store.getModelStore('foo');

    expect(modelStore).toBeDefined();
    expect(modelStore.name).toEqual('foo');
    expect(store.modelStores['foo']).toBeUndefined();
    expect(store.tempModelStores['foo']).toBeDefined();
  });

  it('should commit temp model stores', () => {
    const store = createModelListStore();

    store.modelStores = {};
    store.tempModelStores = {
      foo: createModelStoreMock({ name: 'foo' }),
    };

    store.commitTempStores();

    expect(store.modelStores['foo']).toBeDefined();
    expect(store.tempModelStores['foo']).toBeUndefined();
  });

  it('should get models', () => {
    const store = createModelListStore();

    store.modelStores['foo'] = createModelStoreMock({
      model: {
        name: 'foo',
        value: 'abc',
        isLocal: false,
        errorCount: 0,
      },
    });
    store.modelStores['bar'] = createModelStoreMock({
      model: {
        name: 'bar',
        value: '123',
        isLocal: true,
      },
    });

    expect(store.models).toEqual([
      {
        name: 'foo',
        value: 'abc',
        isLocal: false,
        errorCount: 0,
      },
      {
        name: 'bar',
        value: '123',
        isLocal: true,
      },
    ]);
  });

  it('should set response', () => {
    const store = createModelListStore();

    expect(store.response).toBeUndefined();

    store.setResponse(txnResultMock, false);

    expect(store.response).toEqual(txnResultMock);
  });

  it('should set response and create new stores', () => {
    const store = createModelListStore();

    expect(store.modelStores).toEqual({});

    store.setResponse(txnResultMock, false);

    expect(store.modelStores['foo']).toBeDefined();
    expect(store.modelStores['foo'].response).toEqual(txnResultMock);
    expect(store.modelStores['bar']).toBeDefined();
    expect(store.modelStores['bar'].response).toEqual(txnResultMock);
  });

  it('should propogate response when setting response', () => {
    const store = createModelListStore();
    const setResponseMock = jest.fn();

    store.modelStores = {
      foo: createModelStoreMock({
        setResponse: setResponseMock,
      }),
    };

    v2ListModelsMock.mockResolvedValue(txnResultMock);

    store.setResponse(txnResultMock, true);

    expect(setResponseMock).toHaveBeenCalledWith(txnResultMock, true);
  });

  it('should list models', async () => {
    const store = createModelListStore();

    expect(Object.values(store.modelStores).length).toEqual(0);
    store.engine = 'foo';

    v2ListModelsMock.mockResolvedValue(txnResultMock);

    jest.spyOn(store, 'setResponse');

    store.listModels();

    expect(store.isLoading).toBeTruthy();
    expect(store.isLoaded).toBe(false);

    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.isLoaded).toEqual(true);
    expect(store.setResponse).toHaveBeenCalledWith(txnResultMock, false);
  });

  it('should not list models when engine not selected', () => {
    const store = createModelListStore();
    const mockOnListModels = jest.fn();

    v2ListModelsMock.mockImplementation(mockOnListModels);

    store.listModels();

    expect(mockOnListModels).not.toHaveBeenCalled();
  });

  it('should not list models when database not selected', () => {
    const store = createModelListStore();
    const mockOnListModels = jest.fn();

    store.engine = 'foo';
    store.databaseId = '';

    v2ListModelsMock.mockImplementation(mockOnListModels);

    store.listModels();

    expect(mockOnListModels).not.toHaveBeenCalled();
  });

  it('should handle error when listing model', async () => {
    const store = createModelListStore();

    store.engine = 'foo';

    v2ListModelsMock.mockRejectedValue(new Error('an error'));
    jest.spyOn(store, 'setResponse');

    store.listModels();

    expect(store.isLoading).toBeTruthy();
    expect(store.isLoaded).toBe(false);

    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.isLoaded).toBe(false);
    expect(store.error?.message).toEqual('an error');
    expect(store.setResponse).not.toHaveBeenCalled();
  });

  it('should delete model', async () => {
    const store = createModelListStore();
    const mockOnCloseModelTab = jest.fn();

    store['syncStore'] = createSyncStoreMock({
      closeModelTab: mockOnCloseModelTab,
    });
    store.modelStores = {
      baz: createModelStoreMock(),
    };

    v2DeleteModelsMock.mockResolvedValue(txnResultMock);

    jest.spyOn(store, 'setResponse');

    store.deleteModel('baz');

    expect(store.modelStores['baz']).toBeUndefined();

    await waitFor(() =>
      expect(store.setResponse).toHaveBeenCalledWith(txnResultMock, true),
    );
    expect(store.modelStores['baz']).toBeUndefined();
    expect(mockOnCloseModelTab).toHaveBeenCalledWith(databaseId, 'baz');
  });

  it('should rollback when deleting model fails', async () => {
    const store = createModelListStore();

    store.modelStores = {
      baz: createModelStoreMock(),
    };

    v2DeleteModelsMock.mockRejectedValue(new Error('an error'));

    jest.spyOn(store, 'setResponse');

    const promise = store.deleteModel('baz');

    expect(store.modelStores['baz']).toBeUndefined();

    try {
      await promise;
    } catch (error: any) {
      expect(error.message).toEqual('an error');
    }

    expect(store.setResponse).not.toHaveBeenCalled();
    expect(store.modelStores['baz']).toBeDefined();
  });

  it('should rename model', async () => {
    const store = createModelListStore();
    const mockOnRenameModelTab = jest.fn();

    store['syncStore'] = createSyncStoreMock({
      renameModelTab: mockOnRenameModelTab,
    });
    store.modelStores = {
      baz: createModelStoreMock(),
    };

    v2RenameModelMock.mockResolvedValue(txnResultMock);

    jest.spyOn(store, 'setResponse');

    store.renameModel('baz', 'foo');

    expect(store.modelStores['baz']).toBeUndefined();
    expect(store.modelStores['foo']).toBeDefined();

    await waitFor(() =>
      expect(store.setResponse).toHaveBeenCalledWith(txnResultMock, true),
    );
    expect(store.modelStores['baz']).toBeUndefined();
    expect(store.modelStores['foo']).toBeDefined();
    expect(mockOnRenameModelTab).toHaveBeenCalledWith(databaseId, 'baz', 'foo');
  });

  it('should rollback when renaming model fails', async () => {
    const store = createModelListStore();

    store.modelStores = {
      baz: createModelStoreMock(),
    };

    v2RenameModelMock.mockRejectedValue(new Error('an error'));

    jest.spyOn(store, 'setResponse');

    const promise = store.renameModel('baz', 'foo');

    expect(store.modelStores['baz']).toBeUndefined();
    expect(store.modelStores['foo']).toBeDefined();

    try {
      await promise;
    } catch (error: any) {
      expect(error.message).toEqual('an error');
    }

    expect(store.setResponse).not.toHaveBeenCalled();
    expect(store.modelStores['baz']).toBeDefined();
    expect(store.modelStores['foo']).toBeUndefined();
  });

  it('should import new models', async () => {
    const store = createModelListStore();

    v2InstallModelsMock.mockResolvedValue(txnResultMock);

    jest.spyOn(store, 'setResponse');

    store.importModels([
      {
        name: 'foo',
        value: 'fooValue',
      },
      { name: 'bar', value: 'barValue' },
    ]);

    await waitFor(() =>
      expect(store.setResponse).toHaveBeenCalledWith(txnResultMock, true),
    );
    expect(store.modelStores['foo'].value).toEqual('fooValue');
    expect(store.modelStores['foo'].isSaving).toEqual(false);
    expect(store.modelStores['bar'].value).toEqual('barValue');
    expect(store.modelStores['bar'].isSaving).toEqual(false);
  });

  it('should delete model folder', async () => {
    const store = createModelListStore();
    const mockOnCloseModelTab = jest.fn();

    store['syncStore'] = createSyncStoreMock({
      closeModelTab: mockOnCloseModelTab,
    });
    store.modelStores = {
      'folder/m1': createModelStoreMock({ name: 'folder/m1' }),
      baz: createModelStoreMock(),
      'folder/m2': createModelStoreMock({ name: 'folder/m2' }),
    };

    v2DeleteModelsMock.mockResolvedValue(txnResultMock);

    jest.spyOn(store, 'setResponse');

    store.deleteFolder('folder');

    expect(store.modelStores['folder/m1']).toBeUndefined();
    expect(store.modelStores['baz']).toBeDefined();
    expect(store.modelStores['folder/m2']).toBeUndefined();

    await waitFor(() =>
      expect(store.setResponse).toHaveBeenCalledWith(txnResultMock, true),
    );
    expect(store.modelStores['folder/m1']).toBeUndefined();
    expect(store.modelStores['folder/m2']).toBeUndefined();
    expect(mockOnCloseModelTab).toHaveBeenNthCalledWith(
      1,
      databaseId,
      'folder/m1',
    );
    expect(mockOnCloseModelTab).toHaveBeenNthCalledWith(
      2,
      databaseId,
      'folder/m2',
    );
  });

  it('should rollback when deleting model folder fails', async () => {
    const store = createModelListStore();

    store.modelStores = {
      'folder/m1': createModelStoreMock({ name: 'folder/m1' }),
      baz: createModelStoreMock(),
      'folder/m2': createModelStoreMock({ name: 'folder/m2' }),
    };

    v2DeleteModelsMock.mockRejectedValue(new Error('an error'));

    jest.spyOn(store, 'setResponse');

    const promise = store.deleteFolder('folder');

    expect(store.modelStores['folder/m1']).toBeUndefined();
    expect(store.modelStores['baz']).toBeDefined();
    expect(store.modelStores['folder/m2']).toBeUndefined();

    try {
      await promise;
    } catch (error: any) {
      expect(error.message).toEqual('an error');
    }

    expect(store.setResponse).not.toHaveBeenCalled();
    expect(store.modelStores['folder/m1']).toBeDefined();
    expect(store.modelStores['baz']).toBeDefined();
    expect(store.modelStores['folder/m2']).toBeDefined();
  });

  it('should export models', async () => {
    const store = createModelListStore();
    const exportMock1 = jest.fn();
    const exportMock2 = jest.fn();
    const exportMock3 = jest.fn();

    store.modelStores = {
      'folder/m1': createModelStoreMock({
        name: 'folder/m1',
        exportModel: exportMock1,
      }),
      baz: createModelStoreMock({ exportModel: exportMock2 }),
      'folder/m2': createModelStoreMock({
        name: 'folder/m2',
        exportModel: exportMock3,
      }),
    };

    await store.exportFolder('folder');

    expect(exportMock1).toHaveBeenCalled();
    expect(exportMock2).not.toHaveBeenCalled();
    expect(exportMock3).toHaveBeenCalled();
  });

  it('should export all models', async () => {
    const store = createModelListStore();
    const exportMock1 = jest.fn();
    const exportMock2 = jest.fn();
    const exportMock3 = jest.fn();

    store.modelStores = {
      'folder/m1': createModelStoreMock({
        name: 'folder/m1',
        exportModel: exportMock1,
      }),
      baz: createModelStoreMock({ exportModel: exportMock2 }),
      'folder/m2': createModelStoreMock({
        name: 'folder/m2',
        exportModel: exportMock3,
      }),
    };

    await store.exportFolder('');

    expect(exportMock1).toHaveBeenCalled();
    expect(exportMock2).toHaveBeenCalled();
    expect(exportMock3).toHaveBeenCalled();
  });

  it('should get models auto completions', () => {
    const store = createModelListStore();
    const defs1: RelDefinition[] = [
      {
        name: 'test1',
        type: 'relation',
        reference: {
          name: 'foo',
          type: 'model',
          databaseName: databaseId,
          from: 1,
          to: 2,
          line: 1,
          column: 1,
        },
      },
    ];
    const defs2: RelDefinition[] = [
      {
        name: 'test1:name2',
        type: 'relation',
        reference: {
          name: 'foo',
          type: 'model',
          databaseName: databaseId,
          from: 1,
          to: 2,
          line: 1,
          column: 1,
        },
      },
    ];

    store.modelStores = {
      foo: createModelStoreMock({
        definitions: defs1,
      }),
      bar: createModelStoreMock({
        definitions: defs2,
      }),
    };

    expect(store.definitions).toEqual([...defs1, ...defs2]);
  });

  it('should get error counts', () => {
    const store = createModelListStore();

    store.modelStores = {
      foo: createModelStoreMock({
        errorCount: 3,
      }),
      bar: createModelStoreMock({
        errorCount: 1,
      }),
    };

    expect(store.errorCounts).toStrictEqual({
      foo: 3,
      bar: 1,
    });
  });
});
