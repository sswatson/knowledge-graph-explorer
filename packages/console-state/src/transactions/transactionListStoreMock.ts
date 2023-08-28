import { createFilterStoreMock } from '../filtering/filterStoreMock';
import { TransactionListStore } from './transactionListStore';

type TransactionListStoreMock = Pick<
  TransactionListStore,
  keyof TransactionListStore
>;

export function createTransactionListStoreMock(
  mockValues: Partial<TransactionListStoreMock> = {},
) {
  const mock: TransactionListStoreMock = {
    transactions: undefined,
    filterStore: createFilterStoreMock(),
    filters: {},
    error: undefined,
    isLoading: false,
    loadTransactions: jest.fn(),
    cancelTransaction: jest.fn(),
    pendingQueries: {},
    getTransactionQuery: jest.fn(),
    ...mockValues,
  };

  return mock as TransactionListStore;
}
