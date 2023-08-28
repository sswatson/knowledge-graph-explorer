import { sortBy } from 'lodash-es';
import { makeAutoObservable, runInAction } from 'mobx';

import {
  Client,
  Database,
  SdkError,
} from '@relationalai/rai-sdk-javascript/web';

import { SyncStore } from '../accounts/syncStore';
import { DatabaseStore } from './databaseStore';

export class DatabaseListStore {
  databases: Database[] = [];
  isLoading = false;
  isLoaded = false;
  error?: SdkError = undefined;

  databaseStores: Record<string, DatabaseStore> = {};
  tempDatabaseStores: Record<string, DatabaseStore> = {};

  constructor(
    private syncStore: SyncStore,
    public accountId: string,
    private client: Client,
  ) {
    makeAutoObservable<DatabaseListStore, 'client'>(this, {
      client: false,
    });
  }

  getDatabaseStore(databaseName: string) {
    if (this.databaseStores[databaseName]) {
      return this.databaseStores[databaseName];
    }

    // Avoiding issue by writing modelStores directly during the render
    // commitTempStores will be called in useEffect
    if (!this.tempDatabaseStores[databaseName]) {
      this.tempDatabaseStores[databaseName] = new DatabaseStore(
        this.syncStore,
        this.accountId,
        databaseName,
        this.client,
      );
    }

    return this.tempDatabaseStores[databaseName];
  }

  commitTempStores() {
    Object.keys(this.tempDatabaseStores).forEach(name => {
      this.databaseStores[name] = this.tempDatabaseStores[name];
    });
    this.tempDatabaseStores = {};
  }

  async loadDatabases() {
    if (this.isLoading) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = undefined;
    });

    try {
      const databases = await this.client.listDatabases();

      runInAction(() => {
        this.setDatabases(databases);
        this.isLoading = false;
        this.isLoaded = true;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }

  private setDatabases(databases: Database[]) {
    this.databases = sortBy(databases, 'name');
  }

  async createDatabase(name: string, cloneDatabase?: string) {
    const database = await this.client.createDatabase(name, cloneDatabase);

    runInAction(() => {
      this.setDatabases([...(this.databases || []), database]);
    });
  }

  async deleteDatabase(name: string) {
    try {
      runInAction(() => {
        this.setDatabases((this.databases || []).filter(d => d.name !== name));
        delete this.databaseStores[name];
      });

      await this.client.deleteDatabase(name);
    } catch (error: any) {
      this.loadDatabases();

      throw error;
    }
  }
}
