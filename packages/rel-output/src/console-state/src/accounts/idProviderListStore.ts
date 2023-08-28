import { makeAutoObservable, runInAction } from 'mobx';

import { RequestProps } from '../utils/makeRequest';

function getIdProvidersPath() {
  return `${process.env.NEXT_PUBLIC_BASE_URL}/id-providers`;
}

export type IdProviderDescription = {
  name: string;
  description: string;
};

type IdProviderListReponse = { id_providers: IdProviderDescription[] };

export class IdProviderListStore {
  idProviders: IdProviderDescription[] = [];
  isLoading = false;
  isLoaded = false;
  error?: Error = undefined;
  private baseUrl: string;

  constructor(
    public request: <T>(props: RequestProps) => Promise<{ data: T }>,
  ) {
    makeAutoObservable<IdProviderListStore>(this, {
      request: false,
    });
    this.baseUrl = getIdProvidersPath();
  }

  async loadIdProviderList() {
    if (this.isLoading) {
      return;
    }

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const idProviders = await this.request<IdProviderListReponse>({
        url: `${this.baseUrl}`,
      });

      runInAction(() => {
        this.isLoaded = true;
        this.isLoading = false;
        this.idProviders = idProviders.data.id_providers;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }
}
