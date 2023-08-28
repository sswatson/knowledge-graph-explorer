import { AccountDetailsStore } from './accountDetailsStore';

type AccountDetailsStoreMock = Pick<
  AccountDetailsStore,
  keyof AccountDetailsStore
>;

export function createAccountDetailsStoreMock(
  mockValues: Partial<AccountDetailsStoreMock> = {},
) {
  const mock: AccountDetailsStoreMock = {
    account: undefined,
    isLoading: false,
    isSaving: false,
    error: undefined,
    request: jest.fn(),
    loadAccountDetails: jest.fn(),
    update: jest.fn(),
    ...mockValues,
  };

  return mock as AccountDetailsStore;
}
