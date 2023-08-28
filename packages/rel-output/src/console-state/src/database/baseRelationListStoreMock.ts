import { RelKey } from '@relationalai/rai-sdk-javascript';

import { createClientMock } from '../clientMock';
import { BaseRelation, BaseRelationListStore } from './baseRelationListStore';

type BaseRelationListStoreMock = Pick<
  BaseRelationListStore,
  keyof BaseRelationListStore
>;

export function createBaseRelationListStoreMock(
  mockValues: Partial<BaseRelationListStoreMock> = {},
) {
  const mock: BaseRelationListStoreMock = {
    client: createClientMock(),
    databaseId: '',
    engine: '',
    isLoaded: false,
    setEngine: jest.fn(),
    errorCounts: {},
    commitTempStores: jest.fn(),
    getBaseRelationStore: jest.fn(),
    deleteBaseRelation: jest.fn(),
    loadBaseRelations: jest.fn(),
    addBaseRelations: jest.fn(),
    deleteBaseRelationStore: jest.fn(),
    baseRelations: [],
    baseRelationStores: [],
    tempBaseRelationStores: [],
    isLoading: false,
    error: undefined,
    definitions: [],
    ...mockValues,
  };

  return mock as BaseRelationListStore;
}

export function mockBaseRelation(values: Partial<RelKey> = {}) {
  const mockBaseRelation: BaseRelation = {
    name: '',
    ...values,
  };

  return mockBaseRelation;
}
