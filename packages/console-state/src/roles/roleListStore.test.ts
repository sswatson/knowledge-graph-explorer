import { createClientMock } from '../clientMock';
import { RoleDescription, RoleListStore } from './roleListStore';

const createRoleListStore = (clientMock = createClientMock()) => {
  return new RoleListStore(clientMock);
};

const mockRoles: RoleDescription[] = [
  {
    id: 'a',
    name: 'admin',
    description: 'admin role',
  },
  {
    id: 'u',
    name: 'user',
    description: 'user role',
  },
];

describe('RoleListStore', () => {
  it('should load roles', async () => {
    const clientMock = createClientMock();

    (clientMock as any).get = jest.fn().mockResolvedValue({ roles: mockRoles });

    const store = createRoleListStore(clientMock);

    const promise = store.loadRoles();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toEqual(true);
    expect(store.roles).toEqual([]);

    await promise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toBeUndefined();
    expect(store.roles).toEqual(mockRoles);
  });

  it('should handle error when loading roles', async () => {
    const error = new Error('an error');
    const clientMock = createClientMock();

    (clientMock as any).get = jest.fn().mockRejectedValue(error);

    const store = createRoleListStore(clientMock);
    const promise = store.loadRoles();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toEqual(true);
    expect(store.roles).toEqual([]);

    await promise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toEqual(error);
    expect(store.roles).toEqual([]);
  });

  it('should build descriptionMap', async () => {
    const clientMock = createClientMock();

    (clientMock as any).get = jest.fn().mockResolvedValue({ roles: mockRoles });

    const store = createRoleListStore(clientMock);

    await store.loadRoles();

    expect(store.descriptionMap).toStrictEqual({
      admin: 'admin',
      user: 'user',
    });
  });
});
