import { makeAutoObservable } from 'mobx';

import { Client } from '@relationalai/rai-sdk-javascript/web';

import { SyncStore } from '../accounts/syncStore';
import { ModelListStore } from '../models/modelListStore';
import { BaseRelationListStore } from './baseRelationListStore';

export class DatabaseStore {
  private modelListStore: ModelListStore;
  private baseRelationListStore: BaseRelationListStore;

  constructor(
    private syncStore: SyncStore,
    private accountId: string,
    public databaseName: string,
    client: Client,
  ) {
    makeAutoObservable(this);

    this.modelListStore = new ModelListStore(
      this.syncStore,
      accountId,
      client,
      databaseName,
    );

    this.baseRelationListStore = new BaseRelationListStore(
      accountId,
      this.syncStore,
      client,
      databaseName,
    );
  }

  getModelListStore() {
    return this.modelListStore;
  }

  getBaseRelationListStore() {
    return this.baseRelationListStore;
  }
}
