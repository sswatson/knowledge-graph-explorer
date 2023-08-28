import { waitFor } from '@testing-library/react';

import { User } from '@relationalai/rai-sdk-javascript/web';

import { createClientMock } from '../clientMock';
import { UserListStore } from './userListStore';
import { createUserStoreMock, mockUser } from './userStoreMock';

const mockUsers: User[] = [
  mockUser({
    id: 'id1',
    email: 'user1@foo.bar',
  }),
  mockUser({
    id: 'id2',
    email: 'user2@foo.bar',
  }),
];

const createUserListStore = (clientMock = createClientMock()) => {
  return new UserListStore(clientMock);
};

describe('UserListStore', () => {
  it('should load users', async () => {
    const clientMock = createClientMock({
      listUsers: jest.fn().mockResolvedValue(mockUsers),
    });
    const store = createUserListStore(clientMock);

    const loadPromise = store.loadUsers();

    expect(store.isLoading).toEqual(true);
    expect(store.error).toBeUndefined();
    expect(store.users).toHaveLength(0);

    await loadPromise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toEqual(undefined);
    expect(store.users).toEqual(mockUsers);
  });

  it('should handle error when loading users', async () => {
    const error = new Error('error');
    const clientMock = createClientMock({
      listUsers: jest.fn().mockRejectedValue(error),
    });
    const store = createUserListStore(clientMock);

    const loadPromise = store.loadUsers();

    expect(store.isLoading).toEqual(true);
    expect(store.error).toBeUndefined();
    expect(store.users).toHaveLength(0);

    await loadPromise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toEqual(error);
  });

  it('should create user', async () => {
    const clientMock = createClientMock({
      createUser: jest.fn().mockResolvedValue(mockUsers[0]),
    });
    const store = createUserListStore(clientMock);

    const createPromise = store.createUser(mockUsers[0]);

    expect(store.isCreating).toEqual(true);

    await createPromise;

    expect(store.isCreating).toEqual(false);
    expect(clientMock.createUser).toHaveBeenCalledWith(
      mockUsers[0].email,
      mockUsers[0].roles,
    );
  });

  it('should upsert user', async () => {
    const clientMock = createClientMock({
      listUsers: jest.fn().mockResolvedValue(mockUsers),
    });
    const store = createUserListStore(clientMock);

    await store.loadUsers();

    const updatedUser = {
      ...mockUsers[0],
      email: 'userX@foo.bar',
    };

    store.upsertUser(updatedUser);

    expect(store.users).toEqual([mockUsers[1], updatedUser]);
  });

  it('should handle error when creating user', async () => {
    const error = new Error('an error');
    const clientMock = createClientMock({
      createUser: jest.fn().mockRejectedValue(error),
    });
    const store = createUserListStore(clientMock);

    await expect(async () => {
      await store.createUser(mockUsers[0]);
    }).rejects.toThrowError(error);
  });

  it('should delete user', async () => {
    const clientMock = createClientMock({
      deleteUser: jest.fn().mockResolvedValue({}),
    });
    const id = mockUsers[0].id;
    const store = createUserListStore(clientMock);

    store.users = mockUsers;
    store.userStores = {
      [id]: createUserStoreMock({ userId: id }),
    };

    await store.deleteUser(id);

    expect(Object.keys(store.userStores)).toEqual([]);
    expect(store.users).toEqual([mockUsers[1]]);
    expect(clientMock.deleteUser).toHaveBeenCalledWith(id);
  });

  it('should handle error when deleting user', async () => {
    const error = new Error('an error');
    const clientMock = createClientMock({
      deleteUser: jest.fn().mockRejectedValue(error),
    });
    const id = mockUsers[0].id;
    const store = createUserListStore(clientMock);

    store.users = mockUsers;
    store.userStores = {
      [id]: createUserStoreMock({ userId: id }),
    };

    expect(async () => {
      await store.deleteUser(id);
    }).rejects.toThrowError(error);

    await waitFor(() => expect(Object.keys(store.userStores)).toEqual([id]));
    expect(store.users).toEqual(mockUsers);
  });

  it('should get user store', () => {
    const id = 'foo';
    const store = createUserListStore();

    expect(Object.keys(store.userStores)).toEqual([]);

    const userStore = store.getUserStore(id);

    expect(userStore.userId).toEqual(id);
    expect(Object.keys(store.userStores)).toEqual([id]);
  });
});
