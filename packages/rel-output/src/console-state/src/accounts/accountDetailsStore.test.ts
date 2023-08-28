import { RequestProps } from '../utils/makeRequest';
import { AccountDetailsStore } from './accountDetailsStore';
import { AccountStatus, PrivateLinkStatus } from './types';

const accountId = 'accountId';
const accountName = 'accountName';

const accountMock = {
  id: 'id1',
  name: 'account-one',
  status: AccountStatus.ACTIVE,
  id_providers: ['provider-1'],
  created_by: '',
  privatelink_status: PrivateLinkStatus.ENABLED,
};

const createAccountDetailsStore = (
  requestMock?: <T>(props: RequestProps) => Promise<{ data: T }>,
) => {
  const request =
    requestMock ??
    jest.fn().mockResolvedValue({
      data: { account: accountMock },
    });

  return new AccountDetailsStore(accountId, request, accountName);
};

describe('AccountDetails Store', () => {
  it('should load account details', async () => {
    const store = createAccountDetailsStore();

    const promise = store.loadAccountDetails();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.account).toBeUndefined();

    await promise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toBeUndefined();
    expect(store.account).toStrictEqual(accountMock);
  });

  it('should handle error when loading account details', async () => {
    const error = new Error('account error');
    const store = createAccountDetailsStore(jest.fn().mockRejectedValue(error));

    const promise = store.loadAccountDetails();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.account).toBeUndefined();

    await promise;

    expect(store.isLoading).toEqual(false);
    expect(store.error).toStrictEqual(error);
    expect(store.account).toBeUndefined();
  });

  it('should update account', async () => {
    const store = createAccountDetailsStore();

    store.account = {
      id: 'id1',
      name: 'account-one',
      status: AccountStatus.INACTIVE,
      id_providers: ['bar'],
      created_by: '',
      privatelink_status: PrivateLinkStatus.DISABLED,
    };

    const promise = store.update({
      id_providers: ['provider-1'],
      status: AccountStatus.ACTIVE,
      privatelink_status: PrivateLinkStatus.ENABLED,
    });

    expect(store.error).toBeUndefined();
    expect(store.isSaving).toBe(true);

    await promise;

    expect(store.isSaving).toEqual(false);
    expect(store.error).toBeUndefined();
    expect(store.account).toEqual(accountMock);
  });

  it('should handle error when updating account', async () => {
    const error = new Error('account error');
    const store = createAccountDetailsStore(jest.fn().mockRejectedValue(error));

    store.account = accountMock;

    const promise = store.update({
      id_providers: ['provider-1'],
      status: AccountStatus.ACTIVE,
      privatelink_status: PrivateLinkStatus.ENABLED,
    });

    expect(store.error).toBeUndefined();
    expect(store.isSaving).toEqual(true);
    expect(store.account).toEqual(accountMock);

    try {
      await promise;
    } catch (_error: any) {
      expect(_error).toEqual(error);
    }

    expect(store.isSaving).toEqual(false);
    expect(store.error).toBeUndefined();
    expect(store.account).toEqual(accountMock);
  });
});
