import { IdProviderListStore } from './idProviderListStore';

type IdProviderListStoreMock = Pick<
  IdProviderListStore,
  keyof IdProviderListStore
>;

export function createIdProviderListStoreMock(
  mockValues: Partial<IdProviderListStore> = {},
) {
  const mock: IdProviderListStoreMock = {
    idProviders: [],
    isLoading: false,
    isLoaded: false,
    error: undefined,
    request: jest.fn(),
    loadIdProviderList: jest.fn(),
    ...mockValues,
  };

  return mock as IdProviderListStore;
}
