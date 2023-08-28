import { waitFor } from '@testing-library/react';

import { createClientMock } from '../clientMock';
import { ClientListStore } from './clientListStore';
import { createClientStoreMock } from './clientStoreMock';

const oAuthCLients = [
  {
    name: 'client1',
    account_name: 'account-team',
    created_by: 'user1',
    created_on: '2021-09-07T06:29:52.510Z',
    id: 'id1',
  },
  {
    name: 'client2',
    account_name: 'account-team',
    created_by: 'user2',
    created_on: '2021-09-07T06:29:52.510Z',
    id: 'id2',
  },
  {
    name: 'client3',
    account_name: 'account-team',
    created_by: 'user3',
    created_on: '2021-09-07T06:29:52.510Z',
    id: 'id3',
  },
];

const oAuthCLient = {
  name: 'client',
  account_name: 'account-team',
  created_by: 'user1',
  created_on: '2021-09-07T06:29:52.510Z',
  id: 'id1',
  permissions: [],
  secret: 'secret',
};

const mockClientStore = () => {
  return createClientStoreMock({
    oAuthClient: oAuthCLient,
    oAuthClientId: oAuthCLient.id,
  });
};

const createClientListStore = (clientMock = createClientMock()) => {
  return new ClientListStore(clientMock);
};

describe('client list store', () => {
  it('should load all clients', async () => {
    const clientMock = createClientMock({
      listOAuthClients: jest.fn().mockResolvedValue(oAuthCLients),
    });
    const store = createClientListStore(clientMock);

    const loadPromise = store.loadClients();

    expect(store.isLoading).toBe(true);
    expect(store.error).toBeUndefined();
    expect(store.oAuthClients).toHaveLength(0);

    await loadPromise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toBe(undefined);
    expect(store.oAuthClients).toStrictEqual(oAuthCLients);
  });

  it('should handle error when loading clients', async () => {
    const error = new Error('error');
    const clientMock = createClientMock({
      listOAuthClients: jest.fn().mockRejectedValue(error),
    });
    const store = createClientListStore(clientMock);

    const loadPromise = store.loadClients();

    expect(store.isLoading).toBe(true);
    expect(store.error).toBeUndefined();
    expect(store.oAuthClients).toHaveLength(0);

    await loadPromise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toStrictEqual(error);
  });

  it('should create OAuth Client', async () => {
    const clientName = 'client';
    const clientMock = createClientMock({
      createOAuthClient: jest.fn().mockResolvedValue(oAuthCLient),
    });
    const store = createClientListStore(clientMock);

    const createPromise = store.createOAuthClient(clientName);

    expect(store.isCreating).toBe(true);

    await createPromise;

    expect(store.isCreating).toBe(false);
    expect(clientMock.createOAuthClient).toHaveBeenCalledWith(clientName, []);
  });

  it('should handle error when creating OAuth Client', async () => {
    const error = new Error('oAuth Client create error');
    const clientMock = createClientMock({
      createOAuthClient: jest.fn().mockRejectedValue(error),
    });
    const store = createClientListStore(clientMock);

    expect(async () => {
      await store.createOAuthClient('new client');
    }).rejects.toThrowError(error);
  });

  it('should delete oAuth Client', async () => {
    const clientId = 'id1';
    const clientMock = createClientMock({
      deleteOAuthClient: jest.fn().mockResolvedValue(oAuthCLient),
    });
    const store = createClientListStore(clientMock);

    store.oAuthClients = [oAuthCLient];
    store.clientStores = {
      id1: mockClientStore(),
    };

    await store.deleteOAuthClient(clientId);

    expect(Object.keys(store.clientStores)).toEqual([]);
    expect(store.oAuthClients).toEqual([]);
    expect(clientMock.deleteOAuthClient).toHaveBeenCalledWith(clientId);
  });

  it('should handle error when deleting oAuth Client', async () => {
    const error = new Error('oAuth Client create error');
    const clientId = 'id1';
    const clientMock = createClientMock({
      deleteOAuthClient: jest.fn().mockRejectedValue(error),
    });
    const store = createClientListStore(clientMock);

    store.oAuthClients = [oAuthCLient];
    store.clientStores = {
      id1: mockClientStore(),
    };

    expect(async () => {
      await store.deleteOAuthClient(clientId);
    }).rejects.toThrowError(error);

    await waitFor(() => {
      expect(Object.keys(store.clientStores)).toEqual([clientId]);
      expect(store.oAuthClients).toEqual([oAuthCLient]);
      expect(store.getClientStore(clientId)).toBeDefined();
    });
  });

  it('should get client store', async () => {
    const clientId = 'id1';
    const store = createClientListStore();

    expect(Object.keys(store.clientStores)).toEqual([]);

    const clientStore = store.getClientStore(clientId);

    expect(clientStore.oAuthClientId).toEqual(clientId);
    expect(Object.keys(store.clientStores)).toEqual([clientId]);
  });
});
