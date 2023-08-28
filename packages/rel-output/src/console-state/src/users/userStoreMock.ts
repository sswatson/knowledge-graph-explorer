import { User, UserStatus } from '@relationalai/rai-sdk-javascript/web';

import { UserStore } from './userStore';

type UserStoreMock = Pick<UserStore, keyof UserStore>;

export function createUserStoreMock(mockValues: Partial<UserStoreMock> = {}) {
  const mock: UserStoreMock = {
    userId: '',
    user: undefined,
    error: undefined,
    isLoading: false,
    isSaving: false,
    loadUser: jest.fn(),
    updateUser: jest.fn(),
    ...mockValues,
  };

  return mock as UserStore;
}

export function mockUser(values: Partial<User> = {}) {
  const mockUser: User = {
    id: '',
    email: '',
    id_providers: [],
    roles: [],
    status: UserStatus.ACTIVE,
    ...values,
  };

  return mockUser;
}
