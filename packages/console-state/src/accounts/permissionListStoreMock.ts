import { createClientMock } from '../clientMock';
import { PermissionListStore } from './permissionListStore';

type PermissionListStoreMock = Pick<
  PermissionListStore,
  keyof PermissionListStore
>;

export function createPermissionListStoreMock(
  mockValues: Partial<PermissionListStoreMock> = {},
) {
  const mock: PermissionListStoreMock = {
    permissionList: [],
    groupedPermissionList: {},
    isLoading: false,
    client: createClientMock(),
    loadPermissionList: jest.fn(),
    ...mockValues,
  };

  return mock as PermissionListStore;
}
