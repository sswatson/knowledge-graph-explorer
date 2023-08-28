import {
  makeAutoObservable,
  onBecomeObserved,
  onBecomeUnobserved,
  runInAction,
} from 'mobx';

import {
  Client,
  SdkError,
  TransactionAsync,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';

import {
  DurationFilter,
  Filters,
  FilterStore,
  MultiFilter,
} from '../filtering/filterStore';
import { filter } from '../filtering/filterUtils';
import { TransactionTags } from '../utils/sdkUtils';
import { TERMINATED_STATES } from './transactionStore';

const stateOptions = [
  TransactionAsyncState.ABORTED,
  TransactionAsyncState.CANCELLING,
  TransactionAsyncState.COMPLETED,
  TransactionAsyncState.CREATED,
  TransactionAsyncState.RUNNING,
].map(s => ({ value: s, label: s }));

export type TransactionListFilters = {
  created_by: MultiFilter;
  state: MultiFilter;
  database_name: MultiFilter;
  engine_name: MultiFilter;
  duration: DurationFilter;
};

export class TransactionListStore {
  private txns?: TransactionAsync[] = undefined;
  isLoading = false;
  error?: SdkError = undefined;
  filterStore: FilterStore<TransactionListFilters>;

  pendingQueries: Record<string, Promise<string>> = {};

  private isObserved = false;
  private client: Client;

  constructor(client: Client, userId?: string, private pollInterval = 5000) {
    this.client = client;

    const filters: Filters<TransactionListFilters> = {
      created_by: {
        type: 'multi',
        label: 'Created By',
        options: [],
        isVisible: true,
      },
      state: {
        type: 'multi',
        label: 'State',
        options: stateOptions,
        isVisible: true,
      },
      database_name: { type: 'multi', label: 'Database', options: [] },
      engine_name: { type: 'multi', label: 'Engine', options: [] },
      duration: { type: 'duration', label: 'Duration' },
    };

    if (userId) {
      filters.created_by.value = [userId];
    }

    this.filterStore = new FilterStore<TransactionListFilters>(filters, [
      'created_by',
      'state',
      'database_name',
      'engine_name',
      'duration',
    ]);

    makeAutoObservable<TransactionListStore, 'client'>(this, { client: false });

    onBecomeObserved(this, 'transactions', () => this.resume());
    onBecomeUnobserved(this, 'transactions', () => this.suspend());
  }

  private resume() {
    this.isObserved = true;
    this.loadTransactions();
  }

  private suspend() {
    this.isObserved = false;
  }

  get filters() {
    return this.filterStore.filterValues;
  }

  get transactions() {
    if (this.txns) {
      return filter(this.txns, this.filterStore.filters);
    }

    return this.txns;
  }

  async loadTransactions() {
    if (this.isLoading || !this.isObserved) {
      return;
    }

    runInAction(() => {
      this.error = undefined;
      this.isLoading = true;
    });

    try {
      const transactions = await this.client.listTransactions({
        tags: [`!${TransactionTags.CONSOLE_INTERNAL}`],
      });

      runInAction(() => {
        this.error = undefined;
        this.txns = transactions;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }

    this.pollIfNeeded();
  }

  private async pollIfNeeded() {
    if (this.txns) {
      const shouldPoll = this.txns?.some(
        txn => !TERMINATED_STATES.includes(txn.state),
      );

      if (shouldPoll) {
        await new Promise(res => setTimeout(res, this.pollInterval));
        await this.loadTransactions();
      }
    }
  }

  async cancelTransaction(txnId: string) {
    await this.client.cancelTransaction(txnId);

    this.loadTransactions();
  }

  async getTransactionQuery(txnId: string) {
    const queryPromise = this.pendingQueries[txnId];

    if (queryPromise) {
      return await queryPromise;
    }

    const txn = this.transactions?.find(t => t.id === txnId);

    // saving extra request
    if (txn && txn.query_size === txn.query.length) {
      return txn.query;
    }

    const promise = this.client.getTransactionQuery(txnId);

    runInAction(() => {
      this.pendingQueries[txnId] = promise;
    });

    try {
      return await promise;
    } finally {
      runInAction(() => {
        delete this.pendingQueries[txnId];
      });
    }
  }
}
