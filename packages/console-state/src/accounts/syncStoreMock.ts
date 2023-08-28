import { SyncStore } from './syncStore';

type SyncStoreMock = Pick<SyncStore, keyof SyncStore>;

export function createSyncStoreMock(mockValues: Partial<SyncStoreMock> = {}) {
  const mock: SyncStoreMock = {
    closeWorksheetTab: jest.fn(),
    closeModelTab: jest.fn(),
    renameModelTab: jest.fn(),
    loadBaseRelations: jest.fn(),
    getDatabasesList: jest.fn(),
    getModelsList: jest.fn(),
    getBaseRelationsList: jest.fn(),
    closeBaseRelationTab: jest.fn(),
    selectBottomTab: jest.fn(),
    pollTransaction: jest.fn(),
    deleteBaseRelationStore: jest.fn(),
    isDatabaseModelDirty: jest.fn(),
    flags: {},
    ...mockValues,
  };

  return mock as SyncStore;
}
