import { mapValues } from 'lodash-es';
import { makeAutoObservable, observable, runInAction } from 'mobx';

import { RelDefinition } from '@relationalai/editor-extensions';
import {
  Client,
  ResultTable,
  SdkError,
  TransactionAsyncResult,
} from '@relationalai/rai-sdk-javascript/web';
import {
  filterResults,
  parseDiagnostics,
  parseIcViolations,
} from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';
import {
  v2DeleteModels,
  v2InstallModels,
  v2ListModels,
  v2RenameModel,
} from '../utils/sdkUtils';
import { Model, ModelStore } from './modelStore';

export class ModelListStore {
  isLoading = false;
  isLoaded = false;
  error?: SdkError = undefined;
  loadedAt = 0;
  response?: TransactionAsyncResult = undefined;
  engine = '';

  modelStores: Record<string, ModelStore> = {};
  tempModelStores: Record<string, ModelStore> = {};

  constructor(
    private syncStore: SyncStore,
    private accountId: string,
    public client: Client,
    public databaseId: string,
  ) {
    makeAutoObservable<ModelListStore>(this, {
      client: false,
      response: observable.ref,
    });
  }

  getModelStore(modelName: string) {
    if (this.modelStores[modelName]) {
      return this.modelStores[modelName];
    }

    // Avoiding issue by writing modelStores directly during the render
    // commitTempStores will be called in useEffect
    if (!this.tempModelStores[modelName]) {
      this.tempModelStores[modelName] = new ModelStore(
        this.syncStore,
        this.accountId,
        this.client,
        this.databaseId,
        modelName,
      );
    }

    return this.tempModelStores[modelName];
  }

  commitTempStores() {
    Object.keys(this.tempModelStores).forEach(name => {
      this.modelStores[name] = this.tempModelStores[name];
    });

    this.tempModelStores = {};
  }

  setEngine(engine: string) {
    this.engine = engine;
  }

  get models(): Model[] {
    return Object.values(this.modelStores)
      .filter(ms => !ms.isLocal)
      .map(ms => {
        return ms.model;
      });
  }

  get definitions(): RelDefinition[] {
    return Object.values(this.modelStores).reduce(
      (all: RelDefinition[], { definitions }) => [...all, ...definitions],
      [],
    );
  }

  get errorCounts(): Record<string, number> {
    return mapValues(this.modelStores, 'errorCount');
  }

  setResponse(response: TransactionAsyncResult, installing: boolean) {
    this.response = response;

    const modelNames = readModelNames(response);

    Object.keys(this.modelStores).forEach(modelName => {
      const modelStore = this.modelStores[modelName];

      // removing stores for removed models
      // but only if we don't have unsaved changes
      if (
        !modelNames.includes(modelName) &&
        !modelStore.isDirty &&
        !modelStore.isLocal
      ) {
        delete this.modelStores[modelName];
      }
    });

    modelNames.forEach(modelName => {
      const modelStore = this.getModelStore(modelName);

      modelStore.setResponse(response, installing);
    });

    this.commitTempStores();
  }

  async listModels() {
    if (this.isLoading || !this.engine || !this.databaseId) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = undefined;
    });

    try {
      const response = await v2ListModels(
        this.client,
        this.databaseId,
        this.engine,
      );

      runInAction(() => {
        this.setResponse(response, false);
        this.isLoading = false;
        this.loadedAt = Date.now();
        this.isLoaded = true;
      });
    } catch (error_: any) {
      runInAction(() => {
        this.error = error_;
        this.isLoading = false;
      });
    }
  }

  async deleteModel(modelName: string) {
    const modelStore = this.modelStores[modelName];

    runInAction(() => {
      delete this.modelStores[modelName];
      this.syncStore.closeModelTab(this.databaseId, modelName);
    });

    try {
      const response = await v2DeleteModels(
        this.client,
        this.databaseId,
        this.engine,
        [modelName],
      );

      this.setResponse(response, true);
    } catch (error: any) {
      runInAction(() => {
        this.modelStores[modelName] = modelStore;
      });

      throw error;
    }
  }

  async renameModel(modelName: string, newModelName: string) {
    const modelStore = this.modelStores[modelName];

    if (modelStore) {
      runInAction(() => {
        delete this.modelStores[modelName];
        this.modelStores[newModelName] = modelStore;
        modelStore.setName(newModelName);
        this.syncStore.renameModelTab(this.databaseId, modelName, newModelName);
      });

      try {
        const response = await v2RenameModel(
          this.client,
          this.databaseId,
          this.engine,
          modelName,
          newModelName,
        );

        this.setResponse(response, true);
      } catch (error: any) {
        runInAction(() => {
          delete this.modelStores[newModelName];
          this.modelStores[modelName] = modelStore;
          modelStore.setName(modelName);
        });

        throw error;
      }
    }
  }

  async importModels(models: Model[]) {
    const response = await v2InstallModels(
      this.client,
      this.databaseId,
      this.engine,
      models,
    );

    const diagnostics = parseDiagnostics(response.results);
    const icViolations = parseIcViolations(response.results);
    const transaction = response.transaction;

    this.setResponse(response, true);

    runInAction(() => {
      models.forEach(m => {
        const store = this.modelStores[m.name];

        if (store) {
          store.isLoaded = true;
        }
      });
    });

    return { transaction, diagnostics, icViolations };
  }

  async deleteFolder(folderName: string) {
    const modelStores = this.getModelStoresByFolderPath(folderName);

    try {
      runInAction(() => {
        modelStores.forEach(s => {
          delete this.modelStores[s.name];
          this.syncStore.closeModelTab(this.databaseId, s.name);
        });
      });

      const response = await v2DeleteModels(
        this.client,
        this.databaseId,
        this.engine,
        modelStores.map(s => s.name),
      );

      this.setResponse(response, true);
    } catch (error) {
      runInAction(() => {
        modelStores.forEach(modelStore => {
          this.modelStores[modelStore.name] = modelStore;
        });
      });

      throw error;
    }
  }

  private getModelStoresByFolderPath(folderPath: string) {
    return Object.values(this.modelStores).filter(
      s => folderPath === '' || s.name.startsWith(folderPath + '/'),
    );
  }

  async exportFolder(folderName: string) {
    const modelStores = this.getModelStoresByFolderPath(folderName);

    for (const store of modelStores) {
      store.exportModel();

      // Safari blocks simultaneous download requests
      await new Promise(res => setTimeout(res, 200));
    }
  }
}

function readModelNames(response?: TransactionAsyncResult) {
  if (response) {
    const results = response.results.map(r => new ResultTable(r));
    const resultTables = filterResults(results, [':output', ':__model__']);
    const resultTable = resultTables[0];

    if (resultTable) {
      const col = resultTable.physical().columnAt(0);

      return col.values() as string[];
    }
  }

  return [];
}
