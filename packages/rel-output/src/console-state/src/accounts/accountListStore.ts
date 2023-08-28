import { sortBy } from 'lodash-es';
import { makeAutoObservable, runInAction } from 'mobx';

import { RequestProps } from '../utils/makeRequest';
import { Account, AccountDetailsStore } from './accountDetailsStore';

function getAccountListPath(accountId: string) {
  return [process.env.NEXT_PUBLIC_BASE_URL, accountId, 'accounts'].join('/');
}

export type CreateAccountPayload = Pick<
  Account,
  'id_providers' | 'name' | 'privatelink_status'
> & {
  admin_username: string;
};

type AccountListReponse = { accounts: Account[] };
type CreateAccountResponse = { account: Account };

export class AccountListStore {
  accounts: Account[] = [];
  isLoading = false;
  isCreating = false;
  isLoaded = false;
  accountDetailsStores: Record<string, AccountDetailsStore> = {};
  error?: Error = undefined;
  private baseUrl: string;

  constructor(
    private accountId: string,
    public request: <T>(props: RequestProps) => Promise<{ data: T }>,
  ) {
    makeAutoObservable<AccountListStore>(this, {
      request: false,
    });
    this.baseUrl = getAccountListPath(accountId);
  }

  getAccountDetailsStore(accountDetailsId: string, accountName: string) {
    if (!this.accountDetailsStores[accountDetailsId]) {
      this.accountDetailsStores[accountDetailsId] = new AccountDetailsStore(
        this.accountId,
        this.request,
        accountName,
      );
    }

    return this.accountDetailsStores[accountDetailsId];
  }

  async createAccount(payload: CreateAccountPayload) {
    try {
      if (!this.isCreating) {
        runInAction(() => {
          this.isCreating = true;
        });

        const account = await this.request<CreateAccountResponse>({
          url: this.baseUrl,
          data: payload,
          method: 'POST',
        });

        runInAction(() => {
          this.isCreating = false;
          this.setAccounts([...this.accounts, account.data.account]);
        });

        return account;
      }
    } catch (error: any) {
      runInAction(() => {
        this.isCreating = false;
      });

      throw error;
    }
  }

  private setAccounts(accounts: Account[]) {
    this.accounts = sortBy(accounts, a => a.name);
  }

  async loadAccountList() {
    if (this.isLoading) {
      return;
    }

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const accounts = await this.request<AccountListReponse>({
        url: `${this.baseUrl}`,
      });

      runInAction(() => {
        this.isLoaded = true;
        this.isLoading = false;
        this.accounts = accounts.data.accounts;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }
}
