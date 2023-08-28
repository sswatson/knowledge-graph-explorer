import {
  TransactionAsync,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';

import { TransactionStore } from './transactionStore';

type TransactionStoreMock = Pick<TransactionStore, keyof TransactionStore>;

export function createTransactionStoreMock(
  mockValues: Partial<TransactionStoreMock> = {},
) {
  const mock: TransactionStoreMock = {
    id: '',
    canCancel: false,
    isCancelling: false,
    isTerminated: false,
    isResultLoading: false,
    isTransactionLoading: false,
    isFullQueryLoading: false,
    transaction: undefined,
    fullQuery: undefined,
    output: [],
    diagnostics: [],
    icViolations: [],
    editorDiagnostics: [],
    result: undefined,
    resultError: undefined,
    transactionError: undefined,
    fullQueryError: undefined,
    load: jest.fn(),
    loadResult: jest.fn(),
    loadTransaction: jest.fn(),
    loadFullQuery: jest.fn(),
    cancel: jest.fn(),
    ...mockValues,
  };

  return mock as TransactionStore;
}

export function mockTransaction(
  mockedValue: Partial<TransactionAsync> = {},
): TransactionAsync {
  return {
    id: 'txnId',
    abort_reason: undefined,
    account_name: '',
    created_by: undefined,
    created_on: undefined,
    database_name: '',
    duration: undefined,
    engine_name: '',
    finished_at: undefined,
    last_requested_interval: 0,
    query: '',
    query_size: 0,
    read_only: false,
    response_format_version: '',
    state: TransactionAsyncState.CREATED,
    tags: undefined,
    user_agent: '',
    language: '',
    ...mockedValue,
  };
}
