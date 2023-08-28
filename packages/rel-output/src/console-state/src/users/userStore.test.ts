import { waitFor } from '@testing-library/react';

import { User, UserRole } from '@relationalai/rai-sdk-javascript/web';

import { createClientMock } from '../clientMock';
import { UserStore } from './userStore';
import { mockUser } from './userStoreMock';

const userId = 'userId';

const userMock = mockUser({
  id: userId,
  email: 'foo@bar.baz',
  roles: [UserRole.ADMIN],
});

const createUserStore = (clientMock = createClientMock()) => {
  return new UserStore(clientMock, userId);
};

describe('UserStore', () => {
  it('should load user', async () => {
    const clientMock = createClientMock({
      getUser: jest.fn().mockResolvedValue(userMock),
    });
    const store = createUserStore(clientMock);

    const loadPromise = store.loadUser();

    expect(store.isLoading).toEqual(true);
    expect(store.error).toBeUndefined();
    expect(store.user).toBeUndefined();

    await loadPromise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toBeUndefined();
    expect(store.user).toStrictEqual(userMock);
  });

  it('should handle error when loading user', async () => {
    const error = new Error('load error');
    const clientMock = createClientMock({
      getUser: jest.fn().mockRejectedValue(error),
    });
    const store = createUserStore(clientMock);

    const loadPromise = store.loadUser();

    expect(store.isLoading).toEqual(true);
    expect(store.error).toBeUndefined();
    expect(store.user).toBeUndefined();

    await loadPromise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toStrictEqual(error);
    expect(store.user).toBeUndefined();
  });

  it('should update user', async () => {
    const newUser: User = {
      ...userMock,
      roles: [UserRole.USER],
    };

    const clientMock = createClientMock({
      updateUser: jest.fn().mockResolvedValue(newUser),
    });
    const store = createUserStore(clientMock);

    const updatePromise = store.updateUser(newUser);

    expect(store.isSaving).toEqual(true);

    const updatedUser = await updatePromise;

    expect(store.isSaving).toEqual(false);
    expect(store.user).toEqual(newUser);
    expect(updatedUser).toEqual(newUser);
  });

  it('should handle error when updating user', async () => {
    const newUser: User = {
      ...userMock,
      roles: [UserRole.USER],
    };
    const error = new Error('update error');
    const clientMock = createClientMock({
      updateUser: jest.fn().mockRejectedValue(error),
    });
    const store = createUserStore(clientMock);

    store.user = userMock;

    expect(async () => {
      await store.updateUser(newUser);
    }).rejects.toThrowError(error);

    await waitFor(() => {
      expect(store.user).toEqual(userMock);
    });
  });
});
