import { Engine, EngineSize } from '@relationalai/rai-sdk-javascript/web';

import { EngineState, EngineStore } from './engineStore';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type EngineStoreMock = Pick<EngineStore, keyof EngineStore>;

export function createEngineStoreMock(
  mockValues: Partial<EngineStoreMock> = {},
) {
  const mock: EngineStoreMock = {
    selectedEngine: '',
    engines: [],
    isLoading: false,
    isLoaded: false,
    error: undefined,
    provisionedEngines: [],
    setSelectedEngine: jest.fn(),
    getEngine: jest.fn(),
    loadEngines: jest.fn(),
    deleteEngine: jest.fn(),
    createEngine: jest.fn(),
    resumeEngine: jest.fn(),
    suspendEngine: jest.fn(),
    ...mockValues,
  };

  // casting it to EngineStore because of private fields
  return mock as EngineStore;
}

export function mockEngine(values: Partial<Engine> = {}) {
  const mockEngine: Engine = {
    id: 'mock-engine',
    name: 'mock-engine',
    account_name: '',
    size: EngineSize.XS,
    region: '',
    state: EngineState.PROVISIONED,
    created_by: '',
    requested_on: '',
    created_on: '',
    deleted_on: '',
    ...values,
  };

  return mockEngine;
}
