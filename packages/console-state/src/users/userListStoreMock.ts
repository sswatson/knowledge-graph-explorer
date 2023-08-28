import { UserListStore } from './userListStore';

type UserListStoreMock = Pick<UserListStore, keyof UserListStore>;

export function createUserListStoreMock(
  mockValues: Partial<UserListStoreMock> = {},
) {
  const mock: UserListStoreMock = {
    users: [],
    userStores: {},
    error: undefined,
    isCreating: false,
    isLoaded: false,
    isLoading: false,
    upsertUser: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    getUserStore: jest.fn(),
    loadUsers: jest.fn(),
    ...mockValues,
  };

  return mock as UserListStore;
}
