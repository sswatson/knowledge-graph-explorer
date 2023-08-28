import { makeAutoObservable } from 'mobx';

import {
  AbortError,
  ApiError,
  Client,
  TransactionAsyncResult,
} from '@relationalai/rai-sdk-javascript/web';

import { AccountStore } from './accountStore';

export class SyncStore {
  private txnPollCache: Record<string, Promise<TransactionAsyncResult>> = {};

  constructor(private accountStore: AccountStore) {
    makeAutoObservable<SyncStore, 'txnPollCache'>(this);
  }

  get flags() {
    return this.accountStore.context.flags;
  }

  isDatabaseModelDirty(databaseName: string, modelName: string) {
    const modelList = this.accountStore.getModelListStore(databaseName);

    return !!modelList?.modelStores[modelName]?.isDirty;
  }

  closeWorksheetTab(worksheetId: string) {
    this.accountStore.getEditorStore().closeWorksheetTab(worksheetId);
  }

  closeModelTab(databaseName: string, modelName: string) {
    this.accountStore.getEditorStore().closeModelTab(databaseName, modelName);
  }

  closeBaseRelationTab(databaseName: string, baseRelationName: string) {
    this.accountStore
      .getEditorStore()
      .closeBaseRelationTab(databaseName, baseRelationName);
  }

  renameModelTab(
    databaseName: string,
    modelName: string,
    newModelName: string,
  ) {
    this.accountStore
      .getEditorStore()
      .renameModelTab(databaseName, modelName, newModelName);
  }

  loadBaseRelations(databaseName: string) {
    this.accountStore
      .getBaseRelationListStore(databaseName)
      .loadBaseRelations();
  }

  deleteBaseRelationStore(databaseName: string, baseRelationName: string) {
    this.accountStore
      .getBaseRelationListStore(databaseName)
      .deleteBaseRelationStore(baseRelationName);
  }

  getDatabasesList(forceReload: boolean) {
    const databaseListStore = this.accountStore.getDatabaseListStore();

    if (
      forceReload ||
      !(databaseListStore.isLoaded || databaseListStore.error)
    ) {
      databaseListStore.loadDatabases();
    }

    return {
      databases: databaseListStore.databases,
      isLoading: databaseListStore.isLoading,
      error: databaseListStore.error,
    };
  }

  getBaseRelationsList(
    databaseId: string,
    engine: string,
    forceLoad?: boolean,
  ) {
    const baseRelationListStore = this.accountStore.getBaseRelationListStore(
      databaseId,
    );

    if (
      forceLoad ||
      !(baseRelationListStore.isLoaded || baseRelationListStore.error) ||
      baseRelationListStore.engine !== engine
    ) {
      baseRelationListStore.setEngine(engine);
      baseRelationListStore.loadBaseRelations();
    }

    return {
      isLoading: baseRelationListStore.isLoading,
      error: baseRelationListStore.error,
      baseRelations: baseRelationListStore.baseRelations,
    };
  }

  getModelsList(databaseId: string, engine: string, forceLoad?: boolean) {
    const modelListStore = this.accountStore.getModelListStore(databaseId);

    if (
      forceLoad ||
      !(modelListStore.isLoaded || modelListStore.error) ||
      modelListStore.engine !== engine
    ) {
      modelListStore.setEngine(engine);
      modelListStore.listModels();
    }

    return {
      isLoading: modelListStore.isLoading,
      error: modelListStore.error,
      models: modelListStore.models,
      definitions: modelListStore.definitions,
      isLoaded: modelListStore.isLoaded,
    };
  }

  selectBottomTab(bottomTabId: string) {
    this.accountStore.getEditorStore().selectBottomTab(bottomTabId);
  }

  async pollTransaction(client: Client, txnId: string, signal?: AbortSignal) {
    if (this.txnPollCache[txnId] !== undefined) {
      return this.txnPollCache[txnId];
    }

    const promise = this.pollWithIgnoringErrors(client, txnId, signal);

    this.txnPollCache[txnId] = promise;

    try {
      return await promise;
    } finally {
      delete this.txnPollCache[txnId];
    }
  }

  private async pollWithIgnoringErrors(
    client: Client,
    txnId: string,
    signal?: AbortSignal,
  ): Promise<TransactionAsyncResult> {
    return new Promise((resolve, reject) => {
      let retries = 0;

      const poll = async () => {
        try {
          const result = await client.pollTransaction(txnId, { signal });

          resolve(result);
        } catch (error: any) {
          if (error instanceof ApiError || error instanceof AbortError) {
            reject(error);

            return;
          }

          /* Ignoring "Failed to read server response" error
          // for a few times, as it might be a connectivity issue
          // but most likely it's a response parsing issue
          */
          if (error?.message?.includes('Failed to read server response')) {
            if (retries++ >= 3) {
              reject(error);

              return;
            }
          } else {
            retries = 0;
          }

          // ignoring connectivity errors
          setTimeout(poll, 1000);
        }
      };

      poll();
    });
  }
}
