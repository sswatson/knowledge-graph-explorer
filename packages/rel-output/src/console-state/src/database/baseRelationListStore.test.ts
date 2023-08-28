import { waitFor } from '@testing-library/react';
import { configure } from 'mobx';

import {
  RelKey,
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import { plainToArrow } from '@relationalai/utils';

import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import { BaseRelation, BaseRelationListStore } from './baseRelationListStore';
import { createBaseRelationStoreMock } from './baseRelationStoreMock';

const databaseId = 'bdId';
const accountId = 'accountId';
const visibleEngine = 'visibleEngine';
const mockTransactionId = 'transactionId';

const baseRelationNames = [
  'base relation 1',
  'base relation 2',
  'base relation 3',
];

const txnResultMock: TransactionAsyncResult = {
  transaction: {
    id: mockTransactionId,
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
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

const edbsResultMock: TransactionAsyncResult = {
  transaction: {
    id: 'id',
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
    {
      relationId: '/:output/:test/String/String',
      columns: [['a'], ['b']],
    },
    {
      relationId: `/:output/:__base_relations__/String`,
      columns: [['foo:bar', 'foo:baz', 'bar:baz']],
    },
  ]),
};

const baseRelationMockStores = baseRelationNames.map(name => {
  return createBaseRelationStoreMock({ name });
});

const createBaseRelationListStore = (
  clientMock = createClientMock(),
  syncStoreMock = createSyncStoreMock(),
) => {
  const store = new BaseRelationListStore(
    accountId,
    syncStoreMock,
    clientMock,
    databaseId,
  );

  store.engine = visibleEngine;

  return store;
};

describe('BaseRelationList Store', () => {
  configure({
    safeDescriptors: false,
  });

  it('should get base relation store', () => {
    const store = createBaseRelationListStore();

    const baseRelationStore = store.getBaseRelationStore('foo');

    expect(baseRelationStore).toBeDefined();
    expect(baseRelationStore.name).toEqual('foo');
    expect(store.baseRelationStores.length).toEqual(0);
    expect(store.tempBaseRelationStores.length).toEqual(1);
  });

  it('should commit temp base relations stores', () => {
    const store = createBaseRelationListStore();

    store.baseRelationStores = [];
    store.tempBaseRelationStores = [createBaseRelationStoreMock()];

    store.commitTempStores();

    expect(store.baseRelationStores.length).toEqual(1);
    expect(store.tempBaseRelationStores.length).toEqual(0);
  });

  it('should load base relations', async () => {
    const resolvedValue: RelKey[] = [
      {
        keys: ['RAI_VariableSizeStrings.VariableSizeString', 'Int64'],
        name: 'foo',
        type: 'RelKey',
        values: [],
      },
      {
        keys: ['Int32'],
        name: 'foo',
        type: 'RelKey',
        values: [],
      },
    ];

    const clientMock = createClientMock({
      listEdbs: jest.fn().mockResolvedValue(resolvedValue),
    });
    const store = createBaseRelationListStore(clientMock);

    const promise = store.loadBaseRelations();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.isLoaded).toBe(false);
    expect(store.baseRelations.length).toEqual(0);

    await promise;

    expect(store.isLoading).toBe(false);
    expect(store.isLoaded).toBe(true);

    expect(store.error).toBeUndefined();
    expect(store.baseRelations.length).toBeGreaterThanOrEqual(1);
    expect(store.baseRelations).toStrictEqual([
      {
        name: 'foo',
      },
    ]);
  });

  it('should load base relations via v2', async () => {
    const clientMock = createClientMock({
      exec: jest.fn().mockResolvedValue(edbsResultMock),
    });
    const syncStoreMock = createSyncStoreMock({
      flags: {
        listEdbsV2: true,
      },
    });
    const store = createBaseRelationListStore(clientMock, syncStoreMock);

    const promise = store.loadBaseRelations();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.isLoaded).toBe(false);
    expect(store.baseRelations.length).toEqual(0);

    await promise;

    expect(store.isLoading).toBe(false);
    expect(store.isLoaded).toBe(true);

    expect(store.error).toBeUndefined();
    expect(store.baseRelations).toEqual([
      {
        name: 'foo',
      },
      {
        name: 'bar',
      },
    ]);
  });

  it('should not load base relations when engine not selected', async () => {
    const clientMock = createClientMock({
      listEdbs: jest.fn().mockResolvedValue({}),
    });
    const store = createBaseRelationListStore(clientMock);

    store.engine = '';

    await store.loadBaseRelations();

    expect(clientMock.listEdbs).not.toHaveBeenCalled();
  });

  it('should handle error when loading base relations', async () => {
    const error = new Error('list baseRelations error');
    const clientMock = createClientMock({
      listEdbs: jest.fn().mockRejectedValue(error),
    });
    const store = createBaseRelationListStore(clientMock);

    const promise = store.loadBaseRelations();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.isLoaded).toBe(false);
    expect(store.baseRelations.length).toEqual(0);

    await promise;

    expect(store.isLoading).toBe(false);
    expect(store.isLoaded).toBe(false);
    expect(store.error).toStrictEqual(error);
    expect(store.baseRelations.length).toBe(0);
  });

  it('should get loaded base relation names', async () => {
    const resolvedValue: RelKey[] = [
      {
        keys: ['RAI_VariableSizeStrings.VariableSizeString', 'Int64'],
        name: 'foo',
        type: 'RelKey',
        values: [],
      },
    ];

    const loadedNames = [
      {
        name: 'foo',
      },
    ];

    const clientMock = createClientMock({
      listEdbs: jest.fn().mockResolvedValue(resolvedValue),
    });
    const store = createBaseRelationListStore(clientMock);

    const promise = store.loadBaseRelations();

    await promise;

    expect(store.baseRelations).toStrictEqual(loadedNames);
  });

  it('should delete base relation', async () => {
    const baseRelationList: RelKey[] = [
      {
        keys: ['RAI_VariableSizeStrings.VariableSizeString', 'Int64'],
        name: 'foo',
        type: 'RelKey',
        values: [],
      },
      {
        keys: ['RAI_VariableSizeStrings.VariableSizeString', 'Int64', 'Int64'],
        name: 'bar',
        type: 'RelKey',
        values: [],
      },
    ];

    const updatedBaseRelations: BaseRelation[] = [
      {
        name: 'bar',
      },
    ];

    const syncStoreMock = createSyncStoreMock();
    const clientMock = createClientMock({
      deleteEdb: jest.fn().mockResolvedValue({}),
      listEdbs: jest.fn().mockResolvedValue(baseRelationList),
    });
    const store = createBaseRelationListStore(clientMock, syncStoreMock);

    await store.loadBaseRelations();

    jest.spyOn(store, 'loadBaseRelations');
    jest.spyOn(clientMock, 'listEdbs').mockResolvedValue([baseRelationList[1]]);

    await store.deleteBaseRelation('foo');

    expect(syncStoreMock.closeBaseRelationTab).toHaveBeenCalledWith(
      databaseId,
      'foo',
    );
    expect(clientMock.deleteEdb).toHaveBeenCalledWith(
      databaseId,
      visibleEngine,
      'foo',
    );

    expect(store.loadBaseRelations).not.toHaveBeenCalled();
    expect(store.baseRelations).toStrictEqual(updatedBaseRelations);
  });

  it('should delete base relation store', async () => {
    const baseRelationList: RelKey[] = [
      {
        keys: ['RAI_VariableSizeStrings.VariableSizeString', 'Int64'],
        name: 'foo',
        type: 'RelKey',
        values: [],
      },
      {
        keys: ['RAI_VariableSizeStrings.VariableSizeString', 'Int64', 'Int64'],
        name: 'bar',
        type: 'RelKey',
        values: [],
      },
    ];

    const clientMock = createClientMock({
      listEdbs: jest.fn().mockResolvedValue(baseRelationList),
    });
    const store = createBaseRelationListStore(clientMock);

    await store.loadBaseRelations();

    // to create the stores
    store.getBaseRelationStore('foo');
    store.getBaseRelationStore('bar');
    store.commitTempStores();

    expect(store.baseRelationStores.length).toStrictEqual(2);

    await store.deleteBaseRelationStore('foo');

    expect(store.baseRelationStores.length).toStrictEqual(1);
  });

  it('should throw error when deleting base relation failed', async () => {
    const error = new Error('delete error');
    const clientMock = createClientMock({
      deleteEdb: jest.fn().mockRejectedValue(error),
    });
    const store = createBaseRelationListStore(clientMock);

    jest.spyOn(store, 'loadBaseRelations');

    expect(async () => {
      await store.deleteBaseRelation('foo');
    }).rejects.toThrowError(error);

    await waitFor(() => {
      expect(store.loadBaseRelations).toHaveBeenCalled();
    });
  });

  it('should remove deleted baseRelation from baseRelationStores', async () => {
    const baseRelationList: RelKey[] = [
      {
        keys: ['RAI_VariableSizeStrings.VariableSizeString', 'Int64'],
        name: 'base relation 1',
        type: 'RelKey',
        values: [],
      },
    ];

    const deletedName = 'base relation 1';

    const clientMock = createClientMock({
      deleteEdb: jest.fn().mockResolvedValue([{ name: deletedName }]),
      listEdbs: jest.fn().mockResolvedValue(baseRelationList),
    });

    const store = createBaseRelationListStore(clientMock);

    store.baseRelationStores = baseRelationMockStores;

    await store.loadBaseRelations();

    expect(store.baseRelationStores.length).toStrictEqual(3);

    await store.deleteBaseRelation(deletedName);

    expect(store.baseRelationStores.length).toStrictEqual(2);
    expect(
      store.baseRelationStores.map(store => store.name).includes(deletedName),
    ).toBeFalsy();
  });

  it('should addBaseRelation and return transaction, diagnostics and ic violations', async () => {
    const clientMock = createClientMock({
      exec: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationListStore(clientMock);

    const fileInputs = [
      {
        file: {
          content: 'foo',
          name: 'foo.csv',
          relationPath: '',
          size: 115,
        },
        relation: 'foo',
      },
    ];

    const mockDiagnostics = [
      { code: 'PARSE_ERROR', report: 'report 1' },
      { code: 'UNBOUND_VARIABLE', report: 'report 2' },
    ];

    const mockIcViolations = [
      {
        decl_id: ':rel-query-action##123#constaint#0',
        report: 'report 1',
        output: [],
      },
    ];

    const mockTransaction = {
      id: mockTransactionId,
      state: TransactionAsyncState.COMPLETED,
    };

    const mockRelationName = fileInputs[0].relation;

    const makeQueryString = (relationName: string) => {
      const inputName = `${relationName}_file`;
      const queryString = `
      def delete:${relationName} = ${relationName}
      def insert:${relationName} = ${inputName}
    `;

      return queryString + '\n';
    };

    const mockQueryString = makeQueryString(mockRelationName);
    const mockQueryInput = [{ name: 'foo_file', value: 'foo' }];

    const {
      transaction,
      diagnostics,
      icViolations,
    } = await store.addBaseRelations(fileInputs);

    expect(diagnostics).toStrictEqual(mockDiagnostics);
    expect(icViolations).toStrictEqual(mockIcViolations);
    expect(transaction).toEqual(mockTransaction);
    expect(clientMock.exec).toHaveBeenCalledWith(
      databaseId,
      visibleEngine,
      mockQueryString,
      mockQueryInput,
      false,
    );
  });

  it('should throw error when addBaseRelation is failed', () => {
    const error = new Error('error');
    const clientMock = createClientMock({
      exec: jest.fn().mockRejectedValue(error),
    });
    const store = createBaseRelationListStore(clientMock);

    const fileInputs = [
      {
        file: {
          content: 'foo',
          name: 'foo.csv',
          relationPath: '',
          size: 115,
        },
        relation: 'foo',
      },
    ];

    expect(async () => {
      await store.addBaseRelations(fileInputs);
    }).rejects.toThrowError(error);
  });

  it('should load base relations after adding base relation', async () => {
    const clientMock = createClientMock({
      exec: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationListStore(clientMock);

    const fileInputs = [
      {
        file: {
          content: 'foo',
          name: 'foo.csv',
          relationPath: '',
          size: 115,
        },
        relation: 'foo',
      },
    ];

    jest.spyOn(store, 'loadBaseRelations');
    store.addBaseRelations(fileInputs);

    await waitFor(() => {
      expect(store.loadBaseRelations).toHaveBeenCalled();
    });
  });

  it('should get auto completions', () => {
    const store = createBaseRelationListStore();

    jest.spyOn(store, 'baseRelations', 'get').mockReturnValue([
      {
        name: 'baseRelation1',
      },
      {
        name: 'baseRelation2',
      },
    ]);

    expect(store.definitions).toEqual([
      {
        name: 'baseRelation1',
        type: 'baseRelation',
        reference: {
          name: 'baseRelation1',
          type: 'baseRelation',
          databaseName: databaseId,
        },
      },
      {
        name: 'baseRelation2',
        type: 'baseRelation',
        reference: {
          name: 'baseRelation2',
          type: 'baseRelation',
          databaseName: databaseId,
        },
      },
    ]);
  });

  it('should get error counts', () => {
    const store = createBaseRelationListStore();

    store.baseRelationStores = [
      createBaseRelationStoreMock({
        name: 'foo',
        errorCount: 1,
      }),
      createBaseRelationStoreMock({
        name: 'boo',
        errorCount: 0,
      }),
    ];

    expect(store.errorCounts).toStrictEqual({ foo: 1, boo: 0 });
  });
});
