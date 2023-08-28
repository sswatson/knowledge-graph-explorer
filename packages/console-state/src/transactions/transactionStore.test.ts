import { act, waitFor } from '@testing-library/react';

import {
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import { plainToArrow } from '@relationalai/utils';

import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import { TransactionStore } from './transactionStore';
import { mockTransaction } from './transactionStoreMock';

const transactionId = 'transactionId';
const txnResultMock: TransactionAsyncResult = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
    {
      relationId: '/:rel/:catalog/:diagnostic/:message/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['message 1', 'message 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:severity/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['error', 'error'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:code/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['PARSE_ERROR', 'UNBOUND_VARIABLE'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:report/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['report 1', 'report 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:model/Int64/String',
      columns: [[BigInt(2)], ['foo']],
    },
    {
      relationId: '/:output/:test/String/String',
      columns: [['a'], ['b']],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#constaint#0',
      columns: [[[BigInt(123), BigInt(0)]]],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#foo#0',
      columns: [[[BigInt(456), BigInt(0)]]],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:report/HashValue/String',
      columns: [
        [
          [BigInt(123), BigInt(0)],
          [BigInt(456), BigInt(0)],
        ],
        ['report 1', 'report 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:model/HashValue/String',
      columns: [[[BigInt(456), BigInt(0)]], ['foo']],
    },
  ]),
};

const createTransactionStore = (
  clientMock = createClientMock(),
  syncStoreMock = createSyncStoreMock(),
) => {
  return new TransactionStore(syncStoreMock, clientMock, transactionId);
};

describe('transaction store', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  it('should get output', () => {
    const store = createTransactionStore();

    store.result = txnResultMock;

    expect(store.output.length).toEqual(1);
    expect(store.output[0].relationId).toEqual('/:test/String/String');
  });

  it('should get diagnostics', () => {
    const store = createTransactionStore();

    store.result = txnResultMock;

    expect(store.diagnostics).toEqual([
      {
        report: 'report 1',
        message: 'message 1',
        code: 'PARSE_ERROR',
        severity: 'error',
      },
      {
        code: 'UNBOUND_VARIABLE',
        message: 'message 2',
        model: 'foo',
        report: 'report 2',
        severity: 'error',
      },
    ]);
    expect(store.editorDiagnostics).toEqual([]);
  });

  it('should get ic violations', () => {
    const store = createTransactionStore();

    store.result = txnResultMock;

    expect(store.icViolations).toEqual([
      {
        decl_id: ':rel-query-action##123#constaint#0',
        report: 'report 1',
        output: [],
      },
      {
        decl_id: ':rel-query-action##123#foo#0',
        report: 'report 2',
        model: 'foo',
        output: [],
      },
    ]);
  });

  it('should get canCancel', () => {
    const store = createTransactionStore();
    const expectedValues = [
      { state: TransactionAsyncState.ABORTED, value: false },
      { state: TransactionAsyncState.CANCELLING, value: false },
      { state: TransactionAsyncState.COMPLETED, value: false },
      { state: TransactionAsyncState.RUNNING, value: true },
      { state: TransactionAsyncState.CREATED, value: true },
    ];

    expectedValues.forEach(({ state, value }) => {
      store.transaction = mockTransaction({ state });

      expect(store.canCancel).toEqual(value);
    });
  });

  it('should get isTerminated', () => {
    const store = createTransactionStore();
    const expectedValues = [
      { state: TransactionAsyncState.ABORTED, value: true },
      { state: TransactionAsyncState.CANCELLING, value: false },
      { state: TransactionAsyncState.COMPLETED, value: true },
      { state: TransactionAsyncState.RUNNING, value: false },
      { state: TransactionAsyncState.CREATED, value: false },
    ];

    expectedValues.forEach(({ state, value }) => {
      store.transaction = mockTransaction({ state });

      expect(store.isTerminated).toEqual(value);
    });
  });

  it('should load', () => {
    const store = createTransactionStore();

    jest.spyOn(store, 'loadTransaction');
    jest.spyOn(store, 'loadResult');

    store.load();

    expect(store.loadTransaction).toHaveBeenCalled();
    expect(store.loadResult).toHaveBeenCalled();
  });

  it('should load transaction', async () => {
    const txnMock = mockTransaction();
    const store = createTransactionStore(
      createClientMock({
        getTransaction: jest.fn().mockResolvedValue(txnMock),
      }),
    );

    const promise = store.loadTransaction();

    expect(store.transaction).toBeUndefined();
    expect(store.isTransactionLoading).toEqual(true);

    await promise;

    expect(store.transaction).toEqual(txnMock);
    expect(store.isTransactionLoading).toEqual(false);
  });

  it('should not reload transaction when loading', () => {
    const mockOnGetTransaction = jest.fn();
    const store = createTransactionStore(
      createClientMock({
        getTransaction: mockOnGetTransaction,
      }),
    );

    store.isTransactionLoading = true;

    store.loadTransaction();

    expect(mockOnGetTransaction).not.toHaveBeenCalled();
  });

  it('should not reload transaction when in terminated state', () => {
    const mockOnGetTransaction = jest.fn();
    const store = createTransactionStore(
      createClientMock({
        getTransaction: mockOnGetTransaction,
      }),
    );

    store.transaction = mockTransaction({
      state: TransactionAsyncState.COMPLETED,
      finished_at: 1,
      duration: 1,
    });

    store.loadTransaction();

    expect(mockOnGetTransaction).not.toHaveBeenCalled();
  });

  it('should reload transaction when not terminated', () => {
    const mockOnGetTransaction = jest.fn();
    const store = createTransactionStore(
      createClientMock({
        getTransaction: mockOnGetTransaction,
      }),
    );

    store.transaction = mockTransaction({
      state: TransactionAsyncState.RUNNING,
    });

    store.loadTransaction();

    expect(mockOnGetTransaction).toHaveBeenCalled();
  });

  it('should poll transaction details', async () => {
    const mockOnGetTransaction = jest.fn();
    const transaction = mockTransaction({
      state: TransactionAsyncState.RUNNING,
    });
    const store = createTransactionStore(
      createClientMock({
        getTransaction: mockOnGetTransaction.mockResolvedValue({
          ...transaction,
          state: TransactionAsyncState.COMPLETED,
        }),
      }),
    );

    store.transaction = transaction;

    store.load();

    expect(mockOnGetTransaction).toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersToNextTimer();
    });
    jest.runOnlyPendingTimers();

    await waitFor(() => {
      expect(mockOnGetTransaction).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle error when loading transaction', async () => {
    const store = createTransactionStore(
      createClientMock({
        getTransaction: jest.fn().mockRejectedValue(new Error('an error')),
      }),
    );

    const promise = store.loadTransaction();

    expect(store.transaction).toBeUndefined();
    expect(store.isTransactionLoading).toEqual(true);

    await promise;

    expect(store.isTransactionLoading).toEqual(false);
    expect(store.transactionError?.message).toEqual('an error');
  });

  it('should load transaction result', async () => {
    const store = createTransactionStore(
      undefined,
      createSyncStoreMock({
        pollTransaction: jest.fn().mockResolvedValue(txnResultMock),
      }),
    );

    store.transaction = mockTransaction({
      state: TransactionAsyncState.COMPLETED,
    });

    const promise = store.loadResult();

    expect(store.result).toBeUndefined();
    expect(store.isResultLoading).toEqual(true);

    await promise;

    expect(store.result).toEqual(txnResultMock);
    expect(store.isResultLoading).toEqual(false);
  });

  it('should not reload transaction result', () => {
    const mockOnPollTransaction = jest.fn();
    const store = createTransactionStore(
      undefined,
      createSyncStoreMock({
        pollTransaction: mockOnPollTransaction,
      }),
    );

    store.result = txnResultMock;

    store.loadTransaction();

    expect(mockOnPollTransaction).not.toHaveBeenCalled();
  });

  it('should handle error when loading transaction result', async () => {
    const store = createTransactionStore(
      undefined,
      createSyncStoreMock({
        pollTransaction: jest.fn().mockRejectedValue(new Error('an error')),
      }),
    );

    const promise = store.loadResult();

    expect(store.result).toBeUndefined();
    expect(store.isResultLoading).toEqual(true);

    await promise;

    expect(store.isResultLoading).toEqual(false);
    expect(store.resultError?.message).toEqual('an error');
  });

  it('should reload transaction when result polling finishes', async () => {
    const store = createTransactionStore(
      undefined,
      createSyncStoreMock({
        pollTransaction: jest.fn().mockResolvedValue(txnResultMock),
      }),
    );

    jest.spyOn(store, 'loadTransaction').mockResolvedValue();

    await store.loadResult();

    expect(store.loadTransaction).toHaveBeenCalledWith();
  });

  it('should cancel transaction', async () => {
    const store = createTransactionStore(
      createClientMock({
        cancelTransaction: jest.fn().mockResolvedValue({}),
      }),
    );

    store.transaction = mockTransaction({
      state: TransactionAsyncState.RUNNING,
    });

    jest.spyOn(store, 'loadTransaction').mockResolvedValue();

    const promise = store.cancel();

    expect(store.isCancelling).toEqual(true);

    await promise;

    expect(store.isCancelling).toEqual(false);
    expect(store.loadTransaction).toHaveBeenCalled();
  });

  it('should load full query', async () => {
    const client = createClientMock({
      getTransactionQuery: jest.fn().mockResolvedValue('foo'),
    });
    const store = createTransactionStore(client);
    const promise = store.loadFullQuery();

    expect(store.isFullQueryLoading).toEqual(true);

    await promise;

    expect(store.isFullQueryLoading).toEqual(false);
    expect(store.fullQuery).toEqual('foo');
    expect(client.getTransactionQuery).toHaveBeenCalledWith(transactionId);
  });

  it('should handle error when loading full query', async () => {
    const store = createTransactionStore(
      createClientMock({
        getTransactionQuery: jest.fn().mockRejectedValue(new Error('an error')),
      }),
    );
    const promise = store.loadFullQuery();

    expect(store.isFullQueryLoading).toEqual(true);

    await promise;

    expect(store.isFullQueryLoading).toEqual(false);
    expect(store.fullQueryError?.message).toEqual('an error');
  });

  it('should not load full query when not necessary', async () => {
    const client = createClientMock({
      getTransactionQuery: jest.fn().mockResolvedValue('foo'),
    });
    const store = createTransactionStore(client);

    store.transaction = mockTransaction({
      query: 'a',
      query_size: 1,
    });

    await store.loadFullQuery();

    expect(client.getTransactionQuery).not.toHaveBeenCalled();

    store.isFullQueryLoading = true;
    store.transaction = mockTransaction({
      query: 'a',
      query_size: 2,
    });

    await store.loadFullQuery();

    expect(client.getTransactionQuery).not.toHaveBeenCalled();

    store.fullQuery = 'aa';
    store.transaction = mockTransaction({
      query: 'a',
      query_size: 2,
    });

    await store.loadFullQuery();

    expect(client.getTransactionQuery).not.toHaveBeenCalled();
  });
});
