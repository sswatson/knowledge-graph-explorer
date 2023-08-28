import { createClientMock } from '../clientMock';
import { ClientStore } from './clientStore';

type ClientStoreMock = Pick<ClientStore, keyof ClientStore>;

export function createClientStoreMock(
  mockValues: Partial<ClientStoreMock> = {},
) {
  const mock: ClientStoreMock = {
    oAuthClient: undefined,
    oAuthClientId: '',
    isLoading: false,
    isSaving: false,
    isRotatingSecret: false,
    error: undefined,
    client: createClientMock(),
    loadClient: jest.fn(),
    updateClient: jest.fn(),
    rotateSecret: jest.fn(),
    ...mockValues,
  };

  return mock as ClientStore;
}
