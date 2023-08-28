import { waitFor } from '@testing-library/react';

import { OAuthClient, Permission } from '@relationalai/rai-sdk-javascript/web';

import { createClientMock } from '../clientMock';
import { ClientStore } from './clientStore';

const oAuthClientId = 'clientId';

const oAuthCLient: OAuthClient = {
  name: 'client',
  created_by: 'user1',
  created_on: '2021-09-07T06:29:52.510Z',
  id: 'id1',
  permissions: [],
  secret: 'secret',
};

const createClientStore = (clientMock = createClientMock()) => {
  return new ClientStore(clientMock, oAuthClientId);
};

describe('client store', () => {
  it('should load client', async () => {
    const clientMock = createClientMock({
      getOAuthClient: jest.fn().mockResolvedValue(oAuthCLient),
    });
    const store = createClientStore(clientMock);

    const loadPromise = store.loadClient();

    expect(store.isLoading).toBe(true);
    expect(store.error).toBeUndefined();
    expect(store.oAuthClient).toBeUndefined();

    await loadPromise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toBeUndefined();
    expect(store.oAuthClient).toStrictEqual(oAuthCLient);
  });

  it('should handle error when loading client', async () => {
    const error = new Error('load error');
    const clientMock = createClientMock({
      getOAuthClient: jest.fn().mockRejectedValue(error),
    });
    const store = createClientStore(clientMock);

    const loadPromise = store.loadClient();

    expect(store.isLoading).toBe(true);
    expect(store.error).toBeUndefined();
    expect(store.oAuthClient).toBeUndefined();

    await loadPromise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toStrictEqual(error);
    expect(store.oAuthClient).toBe(undefined);
  });

  it('should update client', async () => {
    const newName = 'new-client-name';
    const newPermissions: Permission[] = [
      Permission.LIST_COMPUTES,
      Permission.LIST_DATABASES,
    ];

    const updatedOAuthClient: OAuthClient = {
      name: 'new-client-name',
      created_by: 'user1',
      created_on: '2021-09-07T06:29:52.510Z',
      id: 'id1',
      permissions: [Permission.LIST_COMPUTES, Permission.LIST_DATABASES],
      secret: 'secret',
    };

    const clientMock = createClientMock({
      updateOAuthClient: jest.fn().mockResolvedValue(updatedOAuthClient),
    });
    const store = createClientStore(clientMock);

    store.oAuthClient = oAuthCLient;

    const updatePromise = store.updateClient(newName, newPermissions);

    expect(store.isSaving).toBe(true);

    await updatePromise;

    expect(store.isSaving).toBe(false);
    expect(store.oAuthClient).toStrictEqual(updatedOAuthClient);
  });

  it('should handle error when updating client', async () => {
    const newName = 'new-client-name';
    const newPermissions: Permission[] = [
      Permission.LIST_COMPUTES,
      Permission.LIST_DATABASES,
    ];

    const error = new Error('update error');

    const clientMock = createClientMock({
      updateOAuthClient: jest.fn().mockRejectedValue(error),
    });
    const store = createClientStore(clientMock);

    store.oAuthClient = oAuthCLient;

    expect(store.oAuthClient).toStrictEqual(oAuthCLient);

    expect(async () => {
      await store.updateClient(newName, newPermissions);
    }).rejects.toThrowError(error);

    await waitFor(() => {
      expect(store.oAuthClient).toStrictEqual(oAuthCLient);
    });
  });

  it('should rotate secret', async () => {
    const newClient: OAuthClient = {
      name: 'new-client-name',
      created_by: 'user1',
      created_on: '2021-09-07T06:29:52.510Z',
      id: 'id1',
      permissions: [],
      secret: 'new-secret',
    };

    const clientMock = createClientMock({
      rotateOAuthClientSecret: jest.fn().mockResolvedValue(newClient),
    });
    const store = createClientStore(clientMock);

    store.oAuthClient = oAuthCLient;

    const rotatePromise = store.rotateSecret();

    expect(store.isRotatingSecret).toBe(true);

    await rotatePromise;

    expect(store.isRotatingSecret).toBe(false);

    expect(store.oAuthClient).toStrictEqual(newClient);
  });

  it('should handle error when rotating secret', async () => {
    const error = new Error('update error');

    const clientMock = createClientMock({
      rotateOAuthClientSecret: jest.fn().mockRejectedValue(error),
    });
    const store = createClientStore(clientMock);

    store.oAuthClient = oAuthCLient;

    expect(store.error).toBeUndefined();

    expect(async () => {
      await store.rotateSecret();
    }).rejects.toThrowError(error);

    await waitFor(() => {
      expect(store.oAuthClient).toStrictEqual(oAuthCLient);
    });
  });
});
