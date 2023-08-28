import { sortBy } from 'lodash-es';
import { makeAutoObservable, runInAction } from 'mobx';

import { Client, SdkError, User } from '@relationalai/rai-sdk-javascript/web';

import { UserStore } from './userStore';

type CreatePayload = Pick<User, 'email'> & { roles: string[] };

export class UserListStore {
  users: User[] = [];
  isLoading = false;
  isCreating = false;
  isLoaded = false;
  error?: SdkError = undefined;
  userStores: Record<string, UserStore> = {};

  constructor(private client: Client) {
    makeAutoObservable<UserListStore, 'client'>(this, {
      client: false,
    });
  }

  getUserStore(userId: string) {
    if (!this.userStores[userId]) {
      this.userStores[userId] = new UserStore(this.client, userId);
    }

    return this.userStores[userId];
  }

  async createUser(payload: CreatePayload) {
    try {
      if (!this.isCreating) {
        runInAction(() => {
          this.isCreating = true;
        });

        const user = await this.client.createUser(
          payload.email,
          // TODO remove type casting to UserRole when it's fixed in the SDK
          payload.roles as any,
        );

        runInAction(() => {
          this.isCreating = false;
          this.upsertUser(user);
        });

        return user;
      }
    } catch (error: any) {
      runInAction(() => {
        this.isCreating = false;
      });

      throw error;
    }
  }

  upsertUser(user: User) {
    const otherUsers = this.users.filter(u => u.id !== user.id);

    this.setUsers([...otherUsers, user]);
  }

  private setUsers(users: User[]) {
    this.users = sortBy(users, u => u.email);
  }

  async deleteUser(userId: string) {
    const userStore = this.userStores[userId];
    const user = this.users.find(u => u.id === userId);

    if (user) {
      runInAction(() => {
        delete this.userStores[userId];
        this.users = this.users.filter(u => u.id !== userId);
      });

      try {
        await this.client.deleteUser(userId);
      } catch (error: any) {
        runInAction(() => {
          this.userStores[userId] = userStore;
          this.setUsers([...this.users, user]);
        });

        throw error;
      }
    }
  }

  async loadUsers() {
    try {
      if (!this.isLoading) {
        runInAction(() => {
          this.isLoading = true;
          this.error = undefined;
        });

        const users = await this.client.listUsers();

        runInAction(() => {
          this.isLoaded = true;
          this.isLoading = false;
          this.users = users;
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
