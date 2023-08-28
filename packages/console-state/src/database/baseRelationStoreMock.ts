import { DisplayMode } from '@relationalai/output-arrow';

import { createClientMock } from '../clientMock';
import { BaseRelationStore } from './baseRelationStore';

type BaseRelationStoreMock = Pick<BaseRelationStore, keyof BaseRelationStore>;

export function createBaseRelationStoreMock(
  mockValues: Partial<BaseRelationStoreMock> = {},
) {
  const mock: BaseRelationStoreMock = {
    isRunning: false,
    startedAt: undefined,
    finishedAt: undefined,
    execError: undefined,
    mode: DisplayMode.LOGICAL,
    transactionId: undefined,
    databaseId: '',
    name: '',
    engine: '',
    errorCount: 0,
    outputLimit: 0,
    setOutputLimit: jest.fn(),
    setEngine: jest.fn(),
    client: createClientMock(),
    setMode: jest.fn(),
    load: jest.fn(),
    output: [],
    storedState: {
      engine: '',
    },
    ...mockValues,
  };

  return mock as BaseRelationStore;
}
