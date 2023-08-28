import { makeAutoObservable, runInAction } from 'mobx';

import {
  Client,
  OAuthClient,
  Permission,
  SdkError,
} from '@relationalai/rai-sdk-javascript/web';

export class ClientStore {
  oAuthClient?: OAuthClient = undefined;
  isLoading = false;
  isSaving = false;
  isRotatingSecret = false;
  error?: SdkError = undefined;

  constructor(public client: Client, public oAuthClientId: string) {
    makeAutoObservable<ClientStore>(this, {
      client: false,
    });
  }

  async loadClient() {
    try {
      if (!this.isLoading) {
        runInAction(() => {
          this.isLoading = true;
          this.error = undefined;
        });

        const oAuthClient = await this.client.getOAuthClient(
          this.oAuthClientId,
        );

        runInAction(() => {
          this.isLoading = false;
          this.oAuthClient = oAuthClient;
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }

  async updateClient(name?: string, permissions: Permission[] = []) {
    try {
      if (!this.isSaving) {
        runInAction(() => {
          this.isSaving = true;
        });

        const oAuthClient = await this.client.updateOAuthClient(
          this.oAuthClientId,
          name,
          permissions,
        );

        runInAction(() => {
          this.oAuthClient = oAuthClient;
          this.isSaving = false;
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.isSaving = false;
      });

      throw error;
    }
  }

  async rotateSecret() {
    try {
      if (!this.isRotatingSecret) {
        runInAction(() => {
          this.isRotatingSecret = true;
        });
        const newClient = await this.client.rotateOAuthClientSecret(
          this.oAuthClientId,
        );

        runInAction(() => {
          this.oAuthClient = newClient;
          this.isRotatingSecret = false;
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.isRotatingSecret = false;
      });

      throw error;
    }
  }
}
