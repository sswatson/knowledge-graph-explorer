import { mapValues } from 'lodash-es';
import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { Client } from '@relationalai/rai-sdk-javascript/web';

import { SyncStore } from '../accounts/syncStore';
import { RequestProps } from '../utils/makeRequest';
import WorksheetStore, {
  generateName,
  getWorksheetPath,
  Worksheet,
} from './worksheetStore';

export type WorksheetListItem = {
  id: string;
  name: string;
  createdBy: string;
  createdOn: number;
  updatedOn: number;
};

export type WorksheetListStoreFilters = {
  database?: string;
  createdby?: string;
};
export default class WorksheetListStore {
  isLoaded = false;
  isLoading = false;
  error?: any = undefined;
  filters: WorksheetListStoreFilters = {};
  worksheetsStores: Record<string, WorksheetStore> = {};
  tempWorksheetsStores: Record<string, WorksheetStore> = {};
  private loadAbortController?: AbortController = undefined;
  private loadPromise?: Promise<{ data: WorksheetListItem[] }> = undefined;

  private worksheets: Record<string, Worksheet> = {};
  private baseUrl: string;

  constructor(
    private syncStore: SyncStore,
    public accountId: string,
    public request: <T>(props: RequestProps) => Promise<{ data: T }>,
    private client: Client,
    userId?: string,
  ) {
    makeAutoObservable<WorksheetListStore>(this, {
      request: false,
      tempWorksheetsStores: false,
    });

    if (userId) {
      this.filters = {
        createdby: userId,
      };
    }

    this.baseUrl = getWorksheetPath(accountId);
  }

  get worksheetsList() {
    return Object.values(this.worksheets);
  }

  get errorCounts(): Record<string, number> {
    return mapValues(this.worksheetsStores, 'errorCount');
  }

  get problemCounts(): Record<string, number> {
    return mapValues(this.worksheetsStores, 'problemCount');
  }

  getWorksheetStore(worksheetId: string) {
    if (this.worksheetsStores[worksheetId]) {
      return this.worksheetsStores[worksheetId];
    }

    // Avoiding issue by writing worksheetsStores directly during the render
    // commitTempStores will be called in useEffect
    if (!this.tempWorksheetsStores[worksheetId]) {
      this.tempWorksheetsStores[worksheetId] = new WorksheetStore(
        this.syncStore,
        this.accountId,
        worksheetId,
        this.client,
        this.request,
      );
    }

    return this.tempWorksheetsStores[worksheetId];
  }

  commitTempStores() {
    Object.keys(this.tempWorksheetsStores).forEach(id => {
      this.worksheetsStores[id] = this.tempWorksheetsStores[id];
    });

    this.tempWorksheetsStores = {};
  }

  addNewWorksheet() {
    const id = uuid();
    const wsStore = new WorksheetStore(
      this.syncStore,
      this.accountId,
      id,
      this.client,
      this.request,
      true,
    );

    this.worksheetsStores[id] = wsStore;

    return wsStore;
  }

  get namesMap() {
    return {
      ...mapValues(this.worksheets, ws => ws.name),
      ...mapValues(this.worksheetsStores, s => s.name),
    };
  }

  async filterWorksheets(filters: WorksheetListStoreFilters) {
    runInAction(() => {
      this.filters = filters;
    });

    // abort controller is necessary to abort current ongoing request and make new request to filter worksheets
    // it is also necessary to await for loadPromise, so it will make sure that abort is completed,
    // and new request will not exit when isLoading is true

    if (this.loadAbortController) {
      this.loadAbortController.abort();

      try {
        await this.loadPromise;
        // eslint-disable-next-line no-empty
      } catch {}
    }

    this.loadWorksheets();
  }

  async loadWorksheets() {
    if (this.isLoading) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = undefined;
      this.loadAbortController = new AbortController();
    });

    try {
      this.loadPromise = this.request<WorksheetListItem[]>({
        url: this.baseUrl,
        query: {
          ...this.filters,
        },
        signal: this.loadAbortController?.signal,
      });

      const response = await this.loadPromise;

      runInAction(() => {
        this.setWorksheets(response.data);
        this.isLoaded = true;
        this.isLoading = false;
        this.loadAbortController = undefined;
        this.loadPromise = undefined;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.name === 'AbortError' ? undefined : error;
        this.isLoading = false;
        this.loadAbortController = undefined;
        this.loadPromise = undefined;
      });
    }
  }

  async createWorksheet(name?: string) {
    if (!name) {
      name = generateName();
    }

    const response = await this.request<Worksheet>({
      url: this.baseUrl,
      data: {
        name,
      },
      method: 'POST',
    });

    runInAction(() => {
      if (response.data?.id) {
        this.worksheets[response.data.id] = response.data;
      }
    });

    return response?.data;
  }

  async deleteWorksheet(worksheetId: string) {
    this.syncStore.closeWorksheetTab(worksheetId);

    if (!this.worksheetsStores[worksheetId]?.isNew) {
      await this.request<boolean>({
        url: `${this.baseUrl}/${encodeURIComponent(worksheetId)}`,
        method: 'DELETE',
      });
    }

    runInAction(() => {
      delete this.worksheets[worksheetId];
      delete this.worksheetsStores[worksheetId];
    });
  }

  async renameWorksheet(worksheetId: string, name: string) {
    const worksheetStore = this.worksheetsStores[worksheetId];

    if (worksheetStore) {
      worksheetStore.setName(name);

      runInAction(() => {
        if (this.worksheets[worksheetId]) {
          this.worksheets[worksheetId].name = name;
        }
      });
    } else {
      const res = await this.request<Worksheet>({
        url: `${this.baseUrl}/${encodeURIComponent(worksheetId)}`,
        data: { name },
        method: 'PATCH',
      });

      runInAction(() => {
        this.worksheets[worksheetId] = res.data;
      });
    }
  }

  getWorksheetById(worksheetId: string) {
    return this.worksheets[worksheetId];
  }

  private setWorksheets(worksheets: WorksheetListItem[]) {
    this.worksheets = worksheets.reduce(
      (result, worksheet) => ({
        ...result,
        [worksheet.id]: worksheet,
      }),
      {},
    );
  }
}
