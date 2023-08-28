import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import { DatabaseListStore } from './databaseListStore';
import { mockDatabase } from './databaseListStoreMock';
import { createDatabaseStoreMock } from './databaseStoreMock';

const createDatabaseListStore = (clientMock = createClientMock()) => {
  return new DatabaseListStore(createSyncStoreMock(), 'accId', clientMock);
};

describe('DatabaseListStore', () => {
  const mockDatabases = [
    mockDatabase({ name: 'foo' }),
    mockDatabase({ name: 'bar' }),
    mockDatabase({ name: 'xyz' }),
  ];

  it('should load databases', async () => {
    const clientMock = createClientMock({
      listDatabases: jest.fn().mockResolvedValue(mockDatabases),
    });
    const store = createDatabaseListStore(clientMock);

    const promise = store.loadDatabases();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.databases).toEqual([]);

    await promise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toBeUndefined();
    // should sort by name
    expect(store.databases).toEqual([
      mockDatabases[1],
      mockDatabases[0],
      mockDatabases[2],
    ]);
  });

  it('should get database store', () => {
    const store = createDatabaseListStore();

    const fooStore = store.getDatabaseStore('foo');

    expect(fooStore).toBeDefined();
    expect(fooStore.databaseName).toEqual('foo');
    expect(store.databaseStores['foo']).toBeUndefined();
    expect(store.tempDatabaseStores['foo']).toBeDefined();
  });

  it('should commit temp database stores', () => {
    const store = createDatabaseListStore();

    store.databaseStores = {};
    store.tempDatabaseStores = {
      foo: createDatabaseStoreMock({ databaseName: 'foo' }),
    };

    store.commitTempStores();

    expect(store.databaseStores['foo']).toBeDefined();
    expect(store.tempDatabaseStores['foo']).toBeUndefined();
  });

  it('should handle error when loading databases', async () => {
    const error = new Error('an error');
    const clientMock = createClientMock({
      listDatabases: jest.fn().mockRejectedValue(error),
    });
    const store = createDatabaseListStore(clientMock);

    const promise = store.loadDatabases();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.databases).toEqual([]);

    await promise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toStrictEqual(error);
    expect(store.databases).toEqual([]);
  });

  it('should create database', async () => {
    const mockDb = mockDatabase({ name: 'abc' });
    const clientMock = createClientMock({
      createDatabase: jest.fn().mockResolvedValue(mockDb),
    });
    const store = createDatabaseListStore(clientMock);

    store.databases = mockDatabases;

    await store.createDatabase('abc');

    expect(store.databases).toEqual([
      mockDb,
      mockDatabases[1],
      mockDatabases[0],
      mockDatabases[2],
    ]);
  });

  it('should delete database', async () => {
    const clientMock = createClientMock({
      deleteDatabase: jest.fn().mockResolvedValue({}),
    });
    const store = createDatabaseListStore(clientMock);

    store.databases = mockDatabases;

    await store.deleteDatabase('foo');

    expect(store.databases).toEqual([mockDatabases[1], mockDatabases[2]]);
  });

  it('should reload databases when deleting fails', async () => {
    const error = new Error('an error');
    const clientMock = createClientMock({
      deleteDatabase: jest.fn().mockRejectedValue(error),
    });
    const store = createDatabaseListStore(clientMock);

    jest.spyOn(store, 'loadDatabases');

    await expect(async () => {
      await store.deleteDatabase('foo');
    }).rejects.toThrow('an error');

    expect(store.loadDatabases).toHaveBeenCalled();
  });

  it('should get database store', () => {
    const store = createDatabaseListStore();

    expect(store.getDatabaseStore('foo').databaseName).toEqual('foo');
  });
});
