import { Database, DatabaseState } from '@relationalai/rai-sdk-javascript/web';

import { DatabaseListStore } from './databaseListStore';

type DatabaseListStoreMock = Pick<DatabaseListStore, keyof DatabaseListStore>;

export function createDatabaseListStoreMock(
  mockValues: Partial<DatabaseListStoreMock> = {},
) {
  const mock: DatabaseListStoreMock = {
    accountId: '',
    databases: [],
    error: undefined,
    isLoading: false,
    isLoaded: false,
    databaseStores: {},
    tempDatabaseStores: {},
    deleteDatabase: jest.fn(),
    createDatabase: jest.fn(),
    getDatabaseStore: jest.fn(),
    commitTempStores: jest.fn(),
    loadDatabases: jest.fn(),
    ...mockValues,
  };

  return mock as DatabaseListStore;
}

export function mockDatabase(values: Partial<Database> = {}) {
  const mockDatabase: Database = {
    id: 'mock-db',
    name: 'mock-db',
    account_name: '',
    state: DatabaseState.CREATED,
    created_by: '',
    created_on: '',
    region: '',
    ...values,
  };

  return mockDatabase;
}
