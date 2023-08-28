import { createClientMock } from '../clientMock';
import { ModelListStore } from './modelListStore';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type ModelListStoreMock = Pick<ModelListStore, keyof ModelListStore>;

export function createModelListStoreMock(
  mockValues: Partial<ModelListStoreMock> = {},
) {
  const mock: ModelListStoreMock = {
    isLoading: false,
    error: undefined,
    models: [],
    loadedAt: 0,
    isLoaded: false,
    errorCounts: {},
    engine: '',
    client: createClientMock(),
    setEngine: jest.fn(),
    databaseId: '',
    getModelStore: jest.fn(),
    commitTempStores: jest.fn(),
    listModels: jest.fn(),
    deleteModel: jest.fn(),
    renameModel: jest.fn(),
    importModels: jest.fn(),
    deleteFolder: jest.fn(),
    exportFolder: jest.fn(),
    setResponse: jest.fn(),
    modelStores: {},
    tempModelStores: {},
    definitions: [],
    ...mockValues,
  };

  // casting it to ModelListStore because of private fields
  return mock as ModelListStore;
}
