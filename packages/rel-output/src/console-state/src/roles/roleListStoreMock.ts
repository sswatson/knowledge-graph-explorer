import { RoleListStore } from './roleListStore';

type RoleListStoreMock = Pick<RoleListStore, keyof RoleListStore>;

export function createRoleListStoreMock(
  mockValues: Partial<RoleListStoreMock> = {},
) {
  const mock: RoleListStoreMock = {
    roles: [],
    loadRoles: jest.fn(),
    isLoading: false,
    error: undefined,
    descriptionMap: {},
    ...mockValues,
  };

  return mock as RoleListStore;
}
