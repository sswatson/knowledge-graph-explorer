import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import { DatabaseStore } from './databaseStore';

const accountId = 'accountId';

const createDatabaseStore = (clientMock = createClientMock()) => {
  return new DatabaseStore(createSyncStoreMock(), accountId, 'foo', clientMock);
};

describe('DatabaseStore', () => {
  it('should get model list store', () => {
    const store = createDatabaseStore();

    expect(store.getModelListStore().databaseId).toEqual('foo');
  });

  it('should get base relation list store', () => {
    const store = createDatabaseStore();

    expect(store.getBaseRelationListStore().databaseId).toEqual('foo');
  });
});
