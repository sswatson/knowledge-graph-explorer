import { makeAutoObservable, observable, runInAction } from 'mobx';

import {
  EditorDiagnostic,
  flattenDiagnostics,
  toEditorDiagnostics,
} from '@relationalai/code-editor';
import {
  Client,
  SdkError,
  TransactionAsync,
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import {
  filterOutput,
  parseDiagnostics,
  parseIcViolations,
} from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';

export const CANCELLABLE_STATES = [
  TransactionAsyncState.CREATED,
  TransactionAsyncState.RUNNING,
];

export const TERMINATED_STATES = [
  TransactionAsyncState.ABORTED,
  TransactionAsyncState.COMPLETED,
];

export class TransactionStore {
  id: string;
  transaction?: TransactionAsync = undefined;
  result?: TransactionAsyncResult = undefined;
  isCancelling = false;
  isTransactionLoading = false;
  isFullQueryLoading = false;
  isResultLoading = false;
  transactionError?: SdkError = undefined;
  resultError?: SdkError = undefined;
  fullQueryError?: SdkError = undefined;
  fullQuery?: string;

  private client: Client;
  private isPolling = false;

  constructor(private syncStore: SyncStore, client: Client, id: string) {
    this.client = client;
    this.id = id;

    makeAutoObservable<TransactionStore, 'client'>(this, {
      client: false,
      result: observable.ref,
    });
  }

  get output() {
    return filterOutput(this.result?.results ?? []);
  }

  get diagnostics() {
    return flattenDiagnostics(parseDiagnostics(this.result?.results ?? []));
  }

  get icViolations() {
    return parseIcViolations(this.result?.results ?? []);
  }

  get editorDiagnostics(): EditorDiagnostic[] {
    return toEditorDiagnostics(
      this.diagnostics.filter(d => !d.model),
      this.transaction?.query || '',
    );
  }

  get canCancel() {
    return (
      !!this.transaction && CANCELLABLE_STATES.includes(this.transaction.state)
    );
  }

  get isTerminated() {
    return (
      !!this.transaction && TERMINATED_STATES.includes(this.transaction.state)
    );
  }

  private get shouldPoll() {
    return (
      this.isTerminated &&
      !!this.transaction &&
      (!this.transaction.finished_at || !this.transaction.duration)
    );
  }

  async load() {
    await Promise.all([this.loadResult(), this.loadTransaction()]);
  }

  async loadTransaction(force = false) {
    if (
      (this.isTransactionLoading || this.isTerminated || this.isPolling) &&
      !force
    ) {
      return;
    }

    runInAction(() => {
      this.transactionError = undefined;
      this.isTransactionLoading = true;
    });

    try {
      const transaction = await this.client.getTransaction(this.id);

      runInAction(() => {
        this.transaction = transaction;
        this.isTransactionLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.transactionError = error;
        this.isTransactionLoading = false;
      });
    }

    if (!this.shouldPoll) {
      this.isPolling = false;
    } else {
      this.isPolling = true;
      await new Promise(res => setTimeout(res, 5000));
      this.loadTransaction(true);
    }
  }

  async loadResult() {
    if (this.result || this.isResultLoading) {
      return;
    }

    runInAction(() => {
      this.resultError = undefined;
      this.isResultLoading = true;
    });

    try {
      const result = await this.syncStore.pollTransaction(this.client, this.id);

      runInAction(() => {
        this.result = result;
        this.isResultLoading = false;
      });

      this.loadTransaction();
    } catch (error: any) {
      runInAction(() => {
        this.resultError = error;
        this.isResultLoading = false;
      });
    }
  }

  async loadFullQuery() {
    if (
      this.fullQuery ||
      this.isFullQueryLoading ||
      (this.transaction &&
        this.transaction.query.length === this.transaction.query_size)
    ) {
      return;
    }

    runInAction(() => {
      this.fullQueryError = undefined;
      this.isFullQueryLoading = true;
    });

    try {
      const fullQuery = await this.client.getTransactionQuery(this.id);

      runInAction(() => {
        this.fullQuery = fullQuery;
        this.isFullQueryLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.fullQueryError = error;
        this.isFullQueryLoading = false;
      });
    }
  }

  async cancel() {
    if (this.canCancel) {
      runInAction(() => {
        this.isCancelling = true;
      });

      try {
        await this.client.cancelTransaction(this.id);
      } catch {
        // just swallowing until we figure out
        // how to handle this on the UI
      } finally {
        await this.loadTransaction();

        runInAction(() => {
          this.isCancelling = false;
        });
      }
    }
  }
}
