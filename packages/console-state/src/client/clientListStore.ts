import { sortBy } from 'lodash-es';
import { makeAutoObservable, runInAction } from 'mobx';

import {
  Client,
  CompactOAuthClient,
  Permission,
  SdkError,
} from '@relationalai/rai-sdk-javascript/web';

import { ClientStore } from './clientStore';

export class ClientListStore {
  oAuthClients: CompactOAuthClient[] = [];
  isLoading = false;
  isCreating = false;
  isLoaded = false;
  error?: SdkError = undefined;
  clientStores: Record<string, ClientStore> = {};

  constructor(public client: Client) {
    makeAutoObservable<ClientListStore>(this, {
      client: false,
      clientStores: false,
    });
  }

  getClientStore(clientId: string) {
    if (!this.clientStores[clientId]) {
      this.clientStores[clientId] = new ClientStore(this.client, clientId);
    }

    return this.clientStores[clientId];
  }

  private setClients(clients: CompactOAuthClient[]) {
    this.oAuthClients = sortBy(clients, c => c.name);
  }

  async createOAuthClient(name: string, permissions: Permission[] = []) {
    try {
      if (!this.isCreating) {
        runInAction(() => {
          this.isCreating = true;
        });

        const responseClient = await this.client.createOAuthClient(
          name,
          permissions,
        );

        runInAction(() => {
          this.isCreating = false;
          this.setClients([...this.oAuthClients, responseClient]);
        });

        return responseClient;
      }
    } catch (error: any) {
      runInAction(() => {
        this.isCreating = false;
      });

      throw error;
    }
  }

  async deleteOAuthClient(clientId: string) {
    const clientStore = this.clientStores[clientId];
    const client = this.oAuthClients.find(c => c.id === clientId);

    if (client) {
      runInAction(() => {
        delete this.clientStores[clientId];
        this.oAuthClients = this.oAuthClients.filter(c => c.id !== clientId);
      });

      try {
        await this.client.deleteOAuthClient(clientId);
      } catch (error: any) {
        runInAction(() => {
          this.clientStores[clientId] = clientStore;
          this.setClients([...this.oAuthClients, client]);
        });

        throw error;
      }
    }
  }

  async loadClients() {
    try {
      if (!this.isLoading) {
        runInAction(() => {
          this.isLoading = true;
          this.error = undefined;
        });

        const clients = await this.client.listOAuthClients();

        runInAction(() => {
          this.isLoaded = true;
          this.isLoading = false;
          this.oAuthClients = clients;
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }
}
