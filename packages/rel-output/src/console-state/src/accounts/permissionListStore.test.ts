import { createClientMock } from '../clientMock';
import { PermissionListStore } from './permissionListStore';

const createPermissionListStore = (clientMock = createClientMock()) => {
  return new PermissionListStore(clientMock);
};

describe('PermissionList Store', () => {
  it('should load Permission List', async () => {
    const mockPermissions = [
      {
        description: 'Cancel transaction',
        name: 'cancel:transaction',
      },
      {
        description: 'Create access keys',
        name: 'create:accesskey',
      },
      {
        description: 'Create databases',
        name: 'create:database',
      },
      {
        description: 'List transactions',
        name: 'list:transaction',
      },
    ];

    const clientMock = createClientMock({
      listPermissions: jest.fn().mockResolvedValue(mockPermissions),
    });
    const store = createPermissionListStore(clientMock);

    const promise = store.loadPermissionList();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.permissionList.length).toEqual(0);

    await promise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toBeUndefined();
    expect(store.permissionList.length).toBeGreaterThanOrEqual(1);
    expect(store.permissionList).toStrictEqual(mockPermissions);
  });

  it('should handle error when loading permission list', async () => {
    const error = new Error('list permission error');
    const clientMock = createClientMock({
      listPermissions: jest.fn().mockRejectedValue(error),
    });
    const store = createPermissionListStore(clientMock);

    const promise = store.loadPermissionList();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.permissionList.length).toEqual(0);

    await promise;

    expect(store.isLoading).toBe(false);
    expect(store.error).toStrictEqual(error);
    expect(store.permissionList.length).toBe(0);
  });

  it('should get grouped permission list', async () => {
    const mockPermissions = [
      {
        description: 'Cancel transaction',
        name: 'cancel:transaction',
      },
      {
        description: 'Update databases',
        name: 'update:database',
      },
      {
        description: 'Create databases',
        name: 'create:database',
      },
      {
        description: 'List transactions',
        name: 'list:transaction',
      },
    ];

    const mockGroupedPermissions = {
      transaction: [
        {
          description: 'Cancel transaction',
          name: 'cancel:transaction',
        },
        {
          description: 'List transactions',
          name: 'list:transaction',
        },
      ],
      database: [
        {
          description: 'Update databases',
          name: 'update:database',
        },
        {
          description: 'Create databases',
          name: 'create:database',
        },
      ],
    };

    const clientMock = createClientMock({
      listPermissions: jest.fn().mockResolvedValue(mockPermissions),
    });
    const store = createPermissionListStore(clientMock);
    const promise = store.loadPermissionList();

    await promise;

    expect(store.groupedPermissionList).toStrictEqual(mockGroupedPermissions);
  });
});
