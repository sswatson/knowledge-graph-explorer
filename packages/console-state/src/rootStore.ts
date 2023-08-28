import { AccountStore } from './accounts/accountStore';
import { NotificationListStore } from './notifications/notificationListStore';
import { StoreContext } from './types';

export class RootStore {
  accountStores: { [accountId: string]: AccountStore } = {};
  notificationListStore: NotificationListStore;

  constructor() {
    this.notificationListStore = new NotificationListStore();
  }

  setContext(context: StoreContext) {
    const { accountId } = context;

    if (!this.accountStores[accountId]) {
      this.accountStores[accountId] = new AccountStore(context);
    } else {
      this.accountStores[accountId].setContext(context);
    }
  }

  getAccountStore(accountId: string) {
    if (!this.accountStores[accountId]) {
      throw new Error(`AccountStore for ${accountId} is not defined`);
    }

    return this.accountStores[accountId];
  }

  getEngineStore(accountId: string) {
    return this.getAccountStore(accountId).engineStore;
  }

  getTransactionListStore(accountId: string) {
    return this.getAccountStore(accountId).getTransactionListStore();
  }

  getTransactionStore(accountId: string, txnId: string) {
    return this.getAccountStore(accountId).getTransactionStore(txnId);
  }

  getWorksheetListStore(accountId: string) {
    return this.getAccountStore(accountId).getWorksheetListStore();
  }

  getModelListStore(accountId: string, databaseId: string) {
    return this.getAccountStore(accountId).getModelListStore(databaseId);
  }

  getBaseRelationListStore(accountId: string, databaseId: string) {
    return this.getAccountStore(accountId).getBaseRelationListStore(databaseId);
  }

  getPermissionListStore(accountId: string) {
    return this.getAccountStore(accountId).getPermissionListStore();
  }

  getIdProviderListStore(accountId: string) {
    return this.getAccountStore(accountId).getIdProviderListStore();
  }

  getRoleListStore(accountId: string) {
    return this.getAccountStore(accountId).getRoleListStore();
  }

  getClientListStore(accountId: string) {
    return this.getAccountStore(accountId).getClientListStore();
  }

  getDatabaseListStore(accountId: string) {
    return this.getAccountStore(accountId).getDatabaseListStore();
  }

  getUserListStore(accountId: string) {
    return this.getAccountStore(accountId).getUserListStore();
  }

  getAccountListStore(accountId: string) {
    return this.getAccountStore(accountId).getAccountListStore();
  }

  getNotificationListStore() {
    return this.notificationListStore;
  }

  getEditorStore(accountId: string) {
    return this.getAccountStore(accountId).getEditorStore();
  }

  getTreeViewStore(accountId: string) {
    return this.getAccountStore(accountId).getTreeViewStore();
  }
}
