import { makeAutoObservable, reaction } from 'mobx';

import { ClientListStore } from '../client/clientListStore';
import { DatabaseListStore } from '../database/databaseListStore';
import { EditorStore } from '../editor/EditorStore';
import { EngineStore } from '../engines/engineStore';
import { RoleListStore } from '../roles/roleListStore';
import { TransactionListStore } from '../transactions/transactionListStore';
import { TransactionStore } from '../transactions/transactionStore';
import { TreeViewStore } from '../treeview/treeViewStore';
import { StoreContext } from '../types';
import { UserListStore } from '../users/userListStore';
import { makeRequest, RequestProps } from '../utils/makeRequest';
import WorksheetListStore from '../worksheets/worksheetListStore';
import { AccountListStore } from './accountListStore';
import { IdProviderListStore } from './idProviderListStore';
import { PermissionListStore } from './permissionListStore';
import { SyncStore } from './syncStore';

export class AccountStore {
  engineStore: EngineStore;
  worksheetListStore?: WorksheetListStore = undefined;
  databaseListStore?: DatabaseListStore = undefined;
  transactionListStore?: TransactionListStore;
  transactionStores: Record<string, TransactionStore> = {};
  permissionListStore: PermissionListStore;
  idProviderListStore: IdProviderListStore;
  roleListStore: RoleListStore;
  clientListStore: ClientListStore;
  userListStore: UserListStore;
  accountListStore: AccountListStore;
  editorStore: EditorStore;
  treeViewStore?: TreeViewStore = undefined;
  request: <T>(props: RequestProps) => Promise<{ data: T }>;
  private syncStore = new SyncStore(this);
  accountId: string;

  constructor(public context: StoreContext) {
    this.accountId = context.accountId;
    this.engineStore = new EngineStore(context.accountId, context.client);
    this.editorStore = new EditorStore(this.syncStore, context.accountId);
    this.request = makeRequest(this.context.getToken);
    this.permissionListStore = new PermissionListStore(this.context.client);
    this.idProviderListStore = new IdProviderListStore(this.request);
    this.roleListStore = new RoleListStore(this.context.client);
    this.clientListStore = new ClientListStore(this.context.client);
    this.userListStore = new UserListStore(this.context.client);
    this.accountListStore = new AccountListStore(
      this.context.accountId,
      this.request,
    );

    makeAutoObservable<AccountStore>(this, {
      engineStore: false,
      transactionListStore: false,
      worksheetListStore: false,
      databaseListStore: false,
      permissionListStore: false,
      editorStore: false,
      treeViewStore: false,
      context: false,
    });
  }

  setContext(context: StoreContext) {
    this.context = context;
  }

  getTransactionListStore() {
    if (!this.transactionListStore) {
      this.transactionListStore = new TransactionListStore(
        this.context.client,
        this.context.userId,
      );
    }

    return this.transactionListStore;
  }

  getTransactionStore(txnId: string) {
    if (!this.transactionStores[txnId]) {
      this.transactionStores[txnId] = new TransactionStore(
        this.syncStore,
        this.context.client,
        txnId,
      );
    }

    return this.transactionStores[txnId];
  }

  getWorksheetStore(worksheetId: string) {
    return this.getWorksheetListStore().getWorksheetStore(worksheetId);
  }

  getWorksheetListStore() {
    if (!this.worksheetListStore) {
      this.worksheetListStore = new WorksheetListStore(
        this.syncStore,
        this.context.accountId,
        this.request,
        this.context.client,
        this.context.userId,
      );

      reaction(
        () => {
          return {
            namesMap: this.worksheetListStore?.namesMap,
            tabs: this.editorStore.tabs,
          };
        },
        ({ namesMap, tabs }) => {
          const patchMap: Record<string, string> = {};

          tabs.forEach(t => {
            if (t.type === 'WORKSHEET' && namesMap) {
              patchMap[t.id] = namesMap[t.worksheetId];
            }
          });

          this.editorStore.patchNames(patchMap);
        },
      );
    }

    return this.worksheetListStore;
  }

  getDatabaseListStore() {
    if (!this.databaseListStore) {
      this.databaseListStore = new DatabaseListStore(
        this.syncStore,
        this.context.accountId,
        this.context.client,
      );
    }

    return this.databaseListStore;
  }

  private getDatabaseStore(databaseId: string) {
    return this.getDatabaseListStore().getDatabaseStore(databaseId);
  }

  getModelListStore(databaseId: string) {
    return this.getDatabaseStore(databaseId).getModelListStore();
  }

  getModelStore(databaseId: string, modelName: string) {
    return this.getModelListStore(databaseId).getModelStore(modelName);
  }

  getBaseRelationListStore(databaseId: string) {
    return this.getDatabaseStore(databaseId).getBaseRelationListStore();
  }

  getPermissionListStore() {
    return this.permissionListStore;
  }

  getIdProviderListStore() {
    return this.idProviderListStore;
  }

  getRoleListStore() {
    return this.roleListStore;
  }

  getClientListStore() {
    return this.clientListStore;
  }

  getUserListStore() {
    return this.userListStore;
  }

  getAccountListStore() {
    return this.accountListStore;
  }

  getEditorStore() {
    return this.editorStore;
  }

  getTreeViewStore() {
    if (!this.treeViewStore) {
      this.treeViewStore = new TreeViewStore(
        this.syncStore,
        this.context.accountId,
      );
      this.treeViewStore.setEngine(this.getEditorStore().visibleEngine);
    }

    return this.treeViewStore;
  }
}
