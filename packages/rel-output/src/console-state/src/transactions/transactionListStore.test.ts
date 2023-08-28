import { waitFor } from '@testing-library/react';
import { reaction } from 'mobx';

import { TransactionAsyncState } from '@relationalai/rai-sdk-javascript/web';

import { createClientMock } from '../clientMock';
import { TransactionListStore } from './transactionListStore';
import { mockTransaction } from './transactionStoreMock';

describe('TransactionListStore', () => {
  it('should not load transactions when not observed', () => {
    const mockTransactions = [mockTransaction({ id: 'foo' })];
    const clientMock = createClientMock({
      listTransactions: jest.fn().mockResolvedValue(mockTransactions),
    });
    const store = new TransactionListStore(clientMock);

    expect(clientMock.listTransactions).not.toHaveBeenCalled();

    store.loadTransactions();

    expect(clientMock.listTransactions).not.toHaveBeenCalled();
  });

  it('should load transactions when observed', async () => {
    const mockTransactions = [mockTransaction({ id: 'foo' })];
    const clientMock = createClientMock({
      listTransactions: jest.fn().mockResolvedValue(mockTransactions),
    });
    const store = new TransactionListStore(clientMock);

    expect(store.transactions).toBeUndefined();
    expect(clientMock.listTransactions).not.toHaveBeenCalled();
    expect(store.isLoading).toEqual(false);

    const cancel = reaction(
      () => store.transactions,
      () => {},
    );

    store.loadTransactions();

    expect(store.isLoading).toEqual(true);

    cancel();

    await waitFor(() =>
      expect(clientMock.listTransactions).toHaveBeenCalledWith({
        tags: ['!console-internal'],
      }),
    );
    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.transactions).toEqual(mockTransactions);
  });

  it('should handle error when loading transactions', async () => {
    const error = new Error('error');
    const clientMock = createClientMock({
      listTransactions: jest.fn().mockRejectedValue(error),
    });
    const store = new TransactionListStore(clientMock);

    expect(store.transactions).toBeUndefined();
    expect(clientMock.listTransactions).not.toHaveBeenCalled();
    expect(store.isLoading).toEqual(false);

    const cancel = reaction(
      () => store.transactions,
      () => {},
    );

    store.loadTransactions();

    expect(store.isLoading).toEqual(true);

    cancel();

    await waitFor(() => expect(clientMock.listTransactions).toHaveBeenCalled());
    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.transactions).toBeUndefined();
    expect(store.error).toEqual(error);
  });

  it('should poll transactions when non terminated transaction is present', async () => {
    const mockTransactions = [
      mockTransaction({ id: 'foo' }),
      mockTransaction({ id: 'bar', state: TransactionAsyncState.RUNNING }),
    ];
    let listTransactionsMock = jest.fn().mockResolvedValue(mockTransactions);
    const clientMock = createClientMock({
      listTransactions: listTransactionsMock,
    });
    const store = new TransactionListStore(clientMock, '', 10);

    store['txns'] = mockTransactions;

    reaction(
      () => store.transactions,
      () => {},
    );

    await waitFor(() => {
      expect(listTransactionsMock.mock.calls.length > 5).toBeTruthy();
    });

    listTransactionsMock = jest.fn().mockResolvedValue([mockTransactions[0]]);
    clientMock.listTransactions = listTransactionsMock;

    await waitFor(() => {
      expect(store.transactions?.length).toEqual(1);
    });
  });

  it('should cancel transactions', async () => {
    const clientMock = createClientMock({
      cancelTransaction: jest.fn().mockResolvedValue({}),
    });
    const store = new TransactionListStore(clientMock);

    jest.spyOn(store, 'loadTransactions');

    await store.cancelTransaction('foo');

    await waitFor(() =>
      expect(clientMock.cancelTransaction).toHaveBeenCalledWith('foo'),
    );
    expect(store.loadTransactions).toHaveBeenCalled();
  });

  it('should filter transactions', () => {
    const clientMock = createClientMock({});
    const store = new TransactionListStore(clientMock);

    const mockTransactions = [
      mockTransaction({ id: 'foo', created_by: 'a' }),
      mockTransaction({ id: 'bar', created_by: 'b' }),
    ];

    store['txns'] = mockTransactions;

    store.filterStore.setFilterValue('created_by', ['b']);

    expect(store.transactions).toEqual([mockTransactions[1]]);
  });

  it('should get transaction query', async () => {
    const clientMock = createClientMock({
      getTransactionQuery: jest.fn().mockResolvedValue('foo'),
    });
    const store = new TransactionListStore(clientMock);

    const promise = store.getTransactionQuery('txnId');

    expect(store.pendingQueries['txnId']).toBeDefined();

    const query = await promise;

    expect(query).toEqual('foo');
    expect(clientMock.getTransactionQuery).toHaveBeenCalledWith('txnId');
    expect(store.pendingQueries['txnId']).toBeUndefined();
  });

  it('should not request transaction query when txn has full query already', async () => {
    const clientMock = createClientMock({
      getTransactionQuery: jest.fn(),
    });
    const store = new TransactionListStore(clientMock);

    store['txns'] = [
      mockTransaction({ id: 'txnId', query: 'foo', query_size: 3 }),
    ];

    const promise = store.getTransactionQuery('txnId');

    expect(store.pendingQueries['txnId']).toBeUndefined();

    const query = await promise;

    expect(query).toEqual('foo');
    expect(clientMock.getTransactionQuery).not.toHaveBeenCalled();
    expect(store.pendingQueries['txnId']).toBeUndefined();
  });
});
