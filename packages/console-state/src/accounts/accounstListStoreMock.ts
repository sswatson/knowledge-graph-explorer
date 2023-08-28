import { AccountListStore } from './accountListStore';

type AccountListStoreMock = Pick<AccountListStore, keyof AccountListStore>;

export function createAccountListStoreMock(
  mockValues: Partial<AccountListStore> = {},
) {
  const mock: AccountListStoreMock = {
    accounts: [],
    isLoading: false,
    isCreating: false,
    isLoaded: false,
    error: undefined,
    request: jest.fn(),
    accountDetailsStores: {},
    createAccount: jest.fn(),
    loadAccountList: jest.fn(),
    getAccountDetailsStore: jest.fn(),
    ...mockValues,
  };

  return mock as AccountListStore;
}
