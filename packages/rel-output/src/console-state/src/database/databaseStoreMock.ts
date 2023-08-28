import { DatabaseStore } from './databaseStore';

type DatabaseStoreMock = Pick<DatabaseStore, keyof DatabaseStore>;

export function createDatabaseStoreMock(
  mockValues: Partial<DatabaseStoreMock> = {},
) {
  const mock: DatabaseStoreMock = {
    databaseName: '',
    getBaseRelationListStore: jest.fn(),
    getModelListStore: jest.fn(),
    ...mockValues,
  };

  return mock as DatabaseStore;
}
