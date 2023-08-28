import { RequestProps } from '../utils/makeRequest';
import { Account } from './accountDetailsStore';
import { AccountListStore } from './accountListStore';
import { AccountStatus, PrivateLinkStatus } from './types';

const accountId = 'accountId';

const accountsMock: Account[] = [
  {
    id: 'id1',
    name: 'account-one',
    status: AccountStatus.ACTIVE,
    id_providers: ['provider-1'],
    created_by: '',
    privatelink_status: PrivateLinkStatus.DISABLED,
  },
  {
    id: 'id2',
    name: 'account-two',
    status: AccountStatus.ACTIVE,
    id_providers: ['provider-2'],
    created_by: '',
    privatelink_status: PrivateLinkStatus.DISABLED,
  },
  {
    id: 'id3',
    name: 'account-three',
    status: AccountStatus.ACTIVE,
    id_providers: null,
    created_by: '',
    privatelink_status: PrivateLinkStatus.DISABLED,
  },
];

const createAccountListStore = (
  requestMock?: <T>(props: RequestProps) => Promise<{ data: T }>,
) => {
  const request =
    requestMock ??
    jest.fn().mockResolvedValue({
      data: { accounts: accountsMock },
    });

  return new AccountListStore(accountId, request);
};

describe('AccountList Store', () => {
  it('should load account list', async () => {
    const store = createAccountListStore();

    const promise = store.loadAccountList();

    expect(store.error).toBeUndefined();
    expect(store.isLoaded).toBe(false);
    expect(store.isLoading).toBe(true);
    expect(store.accounts.length).toEqual(0);

    await promise;

    expect(store.isLoaded).toBe(true);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeUndefined();
    expect(store.accounts).toStrictEqual(accountsMock);
  });

  it('should handle error when loading account list', async () => {
    const error = new Error('account list error');

    const store = createAccountListStore(jest.fn().mockRejectedValue(error));

    const promise = store.loadAccountList();

    expect(store.error).toBeUndefined();
    expect(store.isLoaded).toBe(false);
    expect(store.isLoading).toBe(true);
    expect(store.accounts.length).toEqual(0);

    await promise;

    expect(store.isLoaded).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.error).toStrictEqual(error);
    expect(store.accounts.length).toBe(0);
  });

  it('should get account details store', () => {
    const id = 'foo';
    const name = 'accountName';

    const accountMock = {
      id,
      name,
      status: 'ACTIVE',
      id_providers: ['provider-1'],
      created_by: '',
    };

    const requestMock = jest.fn().mockResolvedValue({
      data: { account: accountMock },
    });
    const store = createAccountListStore(requestMock);

    expect(Object.keys(store.accountDetailsStores).length).toEqual(0);

    store.getAccountDetailsStore(id, name);

    expect(store.accountDetailsStores).toBeDefined();
    expect(Object.keys(store.accountDetailsStores)).toEqual([id]);
  });

  it('should create account', async () => {
    const mockAccount = {
      name: 'foo',
      id_providers: ['provider-1'],
      admin_username: 'foo@relational.ai',
      privatelink_status: PrivateLinkStatus.ENABLED,
    };
    const accountResponse = {
      name: 'foo',
      id_providers: ['provider-1'],
      id: 'foo',
      status: AccountStatus.ACTIVE,
      created_by: 'foow',
      privatelink_status: PrivateLinkStatus.ENABLED,
    };
    const requestMock = jest.fn().mockResolvedValue({
      data: { account: accountResponse },
    });

    const store = createAccountListStore(requestMock);

    store.accounts = accountsMock;

    const promise = store.createAccount(mockAccount);

    expect(store.isCreating).toBe(true);

    await promise;

    expect(store.isCreating).toBe(false);
    expect(requestMock).toHaveBeenCalledWith({
      url: 'base-url/accountId/accounts',
      data: mockAccount,
      method: 'POST',
    });
  });

  it('should throw error when creating user', async () => {
    const error = new Error('an error');
    const mockAccount = {
      name: 'foo',
      id_providers: ['provider-1'],
      admin_username: 'foo@relational.ai',
      privatelink_status: PrivateLinkStatus.ENABLED,
    };
    const requestMock = jest.fn().mockRejectedValue(error);

    const store = createAccountListStore(requestMock);

    await expect(async () => {
      await store.createAccount(mockAccount);
    }).rejects.toThrowError(error);
  });
});
