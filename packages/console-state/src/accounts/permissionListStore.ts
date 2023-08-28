import { groupBy } from 'lodash-es';
import { makeAutoObservable, runInAction } from 'mobx';

import {
  Client,
  PermissionDescription,
  SdkError,
} from '@relationalai/rai-sdk-javascript/web';

export class PermissionListStore {
  permissionList: PermissionDescription[] = [];
  isLoading = false;
  error?: SdkError = undefined;

  constructor(public client: Client) {
    makeAutoObservable<PermissionListStore>(this, {
      client: false,
    });
  }

  get groupedPermissionList() {
    const grouped = groupBy(this.permissionList, p => {
      const splited = p.name.split(':');

      return splited[1] || `- ${p.name} -`;
    });

    return grouped;
  }

  async loadPermissionList() {
    if (this.isLoading) {
      return;
    }

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const permissions = await this.client.listPermissions();

      runInAction(() => {
        this.isLoading = false;
        this.permissionList = permissions;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }
}
