import { makeAutoObservable, runInAction } from 'mobx';

import { Client, SdkError } from '@relationalai/rai-sdk-javascript/web';

export type RoleDescription = {
  name: string;
  id: string;
  description: string;
};

export class RoleListStore {
  roles: RoleDescription[] = [];
  isLoading = false;
  error?: SdkError = undefined;

  constructor(private client: Client) {
    makeAutoObservable<RoleListStore, 'client'>(this, {
      client: false,
    });
  }

  async loadRoles() {
    if (this.isLoading) {
      return;
    }

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      // this's a bit of a hack
      // the SDK doesn't have .listRoles function, not sure that it will
      // we're calling the roles endpoint directly here
      const { roles } = await this.client['get']<{ roles: RoleDescription[] }>(
        'roles',
      );

      runInAction(() => {
        this.isLoading = false;
        this.roles = roles;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }

  get descriptionMap() {
    return this.roles.reduce((r: { [key: string]: string }, c) => {
      r[c.name] = c.description.replace(' role', '');

      return r;
    }, {});
  }
}
