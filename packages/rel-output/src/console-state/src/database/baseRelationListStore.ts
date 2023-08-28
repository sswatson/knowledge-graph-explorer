import { keyBy, mapValues, uniqBy } from 'lodash-es';
import { makeAutoObservable, runInAction } from 'mobx';

import { BaseRelationDefinition } from '@relationalai/editor-extensions';
import {
  Client,
  QueryInput,
  ResultTable,
  SdkError,
} from '@relationalai/rai-sdk-javascript/web';
import {
  makeUploadQuery,
  parseDiagnostics,
  parseIcViolations,
  TextFile,
  trimRel,
} from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';
import { TransactionTags } from '../utils/sdkUtils';
import { BaseRelationStore } from './baseRelationStore';

export type BaseRelation = {
  name: string;
};

export type FileBaseRelationInput = {
  relation: string;
  file?: TextFile;
};

export class BaseRelationListStore {
  /* it was decided to store baseRelationStore as an array of objects instead of key-value relationship,
   * because the order of stores is important for UI and key-value relationship does not guarantee order
   */
  baseRelationStores: BaseRelationStore[] = [];
  tempBaseRelationStores: BaseRelationStore[] = [];
  private response: BaseRelation[] = [];
  isLoading = false;
  isLoaded = false;
  error?: SdkError = undefined;
  engine = '';

  constructor(
    private accountId: string,
    private syncStore: SyncStore,
    public client: Client,
    public databaseId: string,
  ) {
    makeAutoObservable<BaseRelationListStore>(this, {
      client: false,
    });
  }

  getBaseRelationStore(name: string) {
    const store = this.baseRelationStores.find(s => s.name === name);

    if (store) {
      return store;
    }

    // Avoiding issue by writing baseRelationStores directly during the render
    // commitTempStores will be called in useEffect
    let tempStore = this.tempBaseRelationStores.find(s => s.name === name);

    if (!tempStore) {
      tempStore = new BaseRelationStore(
        this.syncStore,
        this.accountId,
        this.databaseId,
        name,
        this.client,
      );

      this.tempBaseRelationStores.push(tempStore);
    }

    return tempStore;
  }

  commitTempStores() {
    this.tempBaseRelationStores.forEach(store => {
      this.baseRelationStores.push(store);
    });

    this.tempBaseRelationStores = [];
  }

  get errorCounts() {
    return mapValues(keyBy(this.baseRelationStores, 'name'), 'errorCount');
  }

  setEngine(engine: string) {
    this.engine = engine;
  }

  async loadBaseRelations() {
    if (this.isLoading || !this.databaseId || !this.engine) {
      return;
    }

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const relations = this.syncStore.flags.listEdbsV2
        ? await this.listEdbsV2()
        : await this.client.listEdbs(this.databaseId, this.engine);

      runInAction(() => {
        this.response = relations.map(r => ({ name: r.name }));
        this.isLoading = false;
        this.isLoaded = true;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
        this.isLoading = false;
      });
    }
  }

  private async listEdbsV2() {
    const relName = '__base_relations__';
    const queryString = trimRel(`
      def __metamodel__ = rel_primitive_load_mirror_metamodel[{
        :entry_point, :list_base_all;
        :phase, :front
      }]
      
      def output:${relName}(n) = __metamodel__:qualifier(_, n)
    `);

    const response = await this.client.exec(
      this.databaseId,
      this.engine,
      queryString,
      [],
      true,
      [TransactionTags.CONSOLE_INTERNAL],
    );
    let result: ResultTable | undefined;

    response.results.forEach(rel => {
      const resultTable = new ResultTable(rel);

      if (resultTable.columnLength === 3) {
        const col = resultTable.columnAt(1);

        if (
          col &&
          col.typeDef.type === 'Constant' &&
          col.typeDef.value.value === `:${relName}`
        ) {
          result = resultTable;
        }
      }
    });

    if (!result) {
      throw new Error(
        'Rel Mirror is not available. Please create a new engine.',
      );
    }

    return (result.columnAt(2).values() as string[]).map(name => {
      return { name: name.split(':')[0] };
    });
  }

  deleteBaseRelationStore(name: string) {
    this.baseRelationStores = this.baseRelationStores.filter(s => {
      return s.name !== name;
    });
  }

  async deleteBaseRelation(name: string) {
    if (this.databaseId) {
      this.syncStore.closeBaseRelationTab(this.databaseId, name);

      runInAction(() => {
        this.response = this.response.filter(br => br.name !== name);
        this.deleteBaseRelationStore(name);
      });

      try {
        await this.client.deleteEdb(this.databaseId, this.engine, name);
      } catch (error) {
        this.loadBaseRelations();
        throw error;
      }
    }
  }

  async addBaseRelations(fileInputs: FileBaseRelationInput[]) {
    let queryString = '';
    const queryInputs: QueryInput[] = [];
    const readOnly = false;

    fileInputs.forEach(input => {
      if (input.file && input.relation) {
        const uploadQuery = makeUploadQuery(input.relation, input.file);

        queryString += uploadQuery.queryString + '\n';
        queryInputs.push(uploadQuery.queryInput);
      }
    });

    const response = await this.client.exec(
      this.databaseId,
      this.engine,
      queryString,
      queryInputs,
      readOnly,
    );

    this.loadBaseRelations();

    const diagnostics = parseDiagnostics(response.results).filter(
      d => !d.model,
    );
    const icViolations = parseIcViolations(response.results);
    const transaction = response.transaction;

    return { transaction, diagnostics, icViolations };
  }

  get baseRelations(): BaseRelation[] {
    return uniqBy(this.response, x => x.name);
  }

  get definitions(): BaseRelationDefinition[] {
    return this.baseRelations.map(baseRelation => ({
      name: baseRelation.name,
      type: 'baseRelation',
      reference: {
        name: baseRelation.name,
        type: 'baseRelation',
        databaseName: this.databaseId,
      },
    }));
  }
}
