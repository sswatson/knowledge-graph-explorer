import { makeAutoObservable, runInAction } from 'mobx';

import { RequestProps } from '../utils/makeRequest';
import { AccountStatus, PrivateLinkStatus } from './types';

function getAccountDetailsPath(accountId: string, name: string) {
  return [
    process.env.NEXT_PUBLIC_BASE_URL,
    accountId,
    'accounts',
    encodeURIComponent(name),
  ].join('/');
}

export type Account = {
  id: string;
  name: string;
  created_by: string;
  id_providers: string[] | null;
  status: AccountStatus;
  privatelink_status: PrivateLinkStatus;
};

export type UpdatePayload = {
  id_providers: string[] | null;
  privatelink_status: PrivateLinkStatus;
  status: AccountStatus;
};

type LoadAccountReponse = { account: Account };

export class AccountDetailsStore {
  account?: Account = undefined;
  isLoading = false;
  isSaving = false;
  error?: Error = undefined;

  constructor(
    private accountId: string,
    public request: <T>(props: RequestProps) => Promise<{ data: T }>,
    private accountName: string,
  ) {
    makeAutoObservable<AccountDetailsStore>(this, {
      request: false,
    });
  }

  async loadAccountDetails() {
    try {
      if (!this.isLoading) {
        runInAction(() => {
          this.isLoading = true;
          this.error = undefined;
        });

        const account = await this.request<LoadAccountReponse>({
          url: getAccountDetailsPath(this.accountId, this.accountName),
        });

        runInAction(() => {
          this.isLoading = false;
          this.account = account.data.account;
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }

  async update(payload: UpdatePayload) {
    try {
      if (!this.isSaving) {
        runInAction(() => {
          this.isSaving = true;
        });

        const result = await this.request<LoadAccountReponse>({
          method: 'PATCH',
          url: getAccountDetailsPath(this.accountId, this.accountName),
          data: payload,
        });

        runInAction(() => {
          this.account = result.data.account;
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
}
