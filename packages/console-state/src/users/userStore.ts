import { makeAutoObservable, runInAction } from 'mobx';

import { Client, SdkError, User } from '@relationalai/rai-sdk-javascript/web';

type UpdatePayload = Pick<User, 'status'> & { roles: string[] };

export class UserStore {
  user?: User = undefined;
  isLoading = false;
  isSaving = false;
  error?: SdkError = undefined;

  constructor(private client: Client, public userId: string) {
    makeAutoObservable<UserStore, 'client'>(this, {
      client: false,
    });
  }

  async loadUser() {
    try {
      if (!this.isLoading) {
        runInAction(() => {
          this.isLoading = true;
          this.error = undefined;
        });

        const user = await this.client.getUser(this.userId);

        runInAction(() => {
          this.isLoading = false;
          this.user = user;
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }

  async updateUser(payload: UpdatePayload) {
    try {
      if (!this.isSaving) {
        runInAction(() => {
          this.isSaving = true;
        });

        const user = await this.client.updateUser(
          this.userId,
          payload.status,
          // TODO remove type casting to UserRole when it's fixed in the SDK
          payload.roles as any,
        );

        runInAction(() => {
          this.user = user;
          this.isSaving = false;
        });

        return user;
      }
    } catch (error: any) {
      runInAction(() => {
        this.isSaving = false;
      });

      throw error;
    }
  }
}
