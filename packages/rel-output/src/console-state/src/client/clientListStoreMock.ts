import { createClientMock } from '../clientMock';
import { ClientListStore } from './clientListStore';

type ClientListStoreMock = Pick<ClientListStore, keyof ClientListStore>;

export function createClientListStoreMock(
  mockValues: Partial<ClientListStoreMock> = {},
) {
  const mock: ClientListStoreMock = {
    oAuthClients: [],
    isLoading: false,
    isLoaded: false,
    isCreating: false,
    error: undefined,
    clientStores: {},
    client: createClientMock(),
    getClientStore: jest.fn(),
    createOAuthClient: jest.fn(),
    deleteOAuthClient: jest.fn(),
    loadClients: jest.fn(),
    ...mockValues,
  };

  return mock as ClientListStore;
}
