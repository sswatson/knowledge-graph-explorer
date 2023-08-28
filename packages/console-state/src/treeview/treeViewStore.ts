import { sortBy } from 'lodash-es';
import { makeAutoObservable } from 'mobx';

import { defsToIdbsByModel } from '@relationalai/editor-extensions';
import { convertToTree, ModelNode } from '@relationalai/utils';

import { SyncStore } from '../accounts/syncStore';
import { Model } from '../models/modelStore';
import { TreeViewContextData, TreeViewNode } from './types';

export class TreeViewStore {
  public openedNodes: Record<string, boolean> = {};
  context?: TreeViewContextData = undefined;
  engine = '';
  dbSearchTerm = '';

  constructor(private syncStore: SyncStore, public accountId: string) {
    makeAutoObservable<TreeViewStore>(this);
    this.context = {
      ...this.context,
      accountId,
    };
    this.openedNodes[this.generateNodeId({ type: 'database-root' })] = true;
  }

  setOpenedNodes(openedNodesIds: Record<string, boolean>) {
    this.openedNodes = openedNodesIds;
  }

  get treeData() {
    return [this.buildDatabasesNodes({})];
  }

  setEngine(engine: string) {
    this.engine = engine;
  }

  setOpenDatabaseNodes(databaseId: string) {
    this.openedNodes = {
      ...this.openedNodes,
      [this.generateNodeId({ type: 'database', databaseId })]: true,
      [this.generateNodeId({ type: 'model-root', databaseId })]: true,
    };
  }

  generateNodeId(
    nodeData:
      | { type: 'database-root' }
      | {
          type: 'error' | 'loading';
          parentNodeId: string;
        }
      | {
          type: 'database' | 'base-relation-root' | 'model-root';
          databaseId: string;
        }
      | {
          type: 'base-relation' | 'model-folder' | 'model' | 'idb';
          databaseId: string;
          name: string;
        },
  ) {
    switch (nodeData.type) {
      case 'error':
      case 'loading':
        return `${nodeData.parentNodeId}-${nodeData.type}`;
      case 'database-root':
        return `$${nodeData.type}`;
      case 'database':
      case 'base-relation-root':
      case 'model-root':
        return `$${nodeData.type}-${nodeData.databaseId}`;
      case 'base-relation':
      case 'model-folder':
      case 'model':
      case 'idb':
        return `$${nodeData.type}-${nodeData.databaseId}-${nodeData.name}`;
    }
  }

  private buildDatabasesNodes(forceReload: {
    models?: boolean;
    baseRelations?: boolean;
    databases?: boolean;
  }) {
    const rootNode: TreeViewNode = {
      id: this.generateNodeId({ type: 'database-root' }),
      name: 'Databases',
      data: { type: 'database-root' },
      hasChildren: true,
    };

    if (!this.engine) {
      rootNode.children = [
        this.makeErrorNode(rootNode.id, undefined, 'Select engine'),
      ];
    } else if (this.openedNodes[rootNode.id]) {
      const { databases, isLoading, error } = this.syncStore.getDatabasesList(
        !!forceReload.databases,
      );

      if (error) {
        rootNode.children = [this.makeErrorNode(rootNode.id, error)];
      } else if (isLoading && !databases.length) {
        rootNode.children = [this.makeLoadingNode(rootNode.id)];
      } else if (databases) {
        rootNode.children = databases
          .filter(db =>
            db.name
              .toString()
              .toLowerCase()
              .includes(this.dbSearchTerm.toLowerCase()),
          )
          .map(database => {
            return this.buildDatabaseNodes(database.name, forceReload);
          });

        if (rootNode.children.length == 0) {
          rootNode.children = [
            this.makeErrorNode(rootNode.id, undefined, 'No Databases Found'),
          ];
        }
      }
    }

    return rootNode;
  }

  private buildDatabaseNodes(
    databaseId: string,
    forceReload: {
      models?: boolean;
      baseRelations?: boolean;
      databases?: boolean;
    },
  ) {
    const rootNode: TreeViewNode = {
      id: this.generateNodeId({
        type: 'database',
        databaseId: databaseId,
      }),
      name: databaseId,
      data: { type: 'database', databaseId },
    };

    rootNode.hasChildren = !this.openedNodes[rootNode.id];

    if (this.openedNodes[rootNode.id]) {
      rootNode.children = [
        this.buildBaseRelationNodes(databaseId, !!forceReload.baseRelations),
        this.buildModelNodes(databaseId, !!forceReload.models),
      ];
    }

    return rootNode;
  }
  private buildBaseRelationNodes(databaseId: string, forceReload: boolean) {
    const rootNode: TreeViewNode = {
      id: this.generateNodeId({
        type: 'base-relation-root',
        databaseId: databaseId,
      }),
      name: 'Base Relations',
      data: { type: 'base-relation-root', databaseId },
    };

    rootNode.hasChildren = !this.openedNodes[rootNode.id];

    if (this.openedNodes[rootNode.id]) {
      const {
        baseRelations,
        error,
        isLoading,
      } = this.syncStore.getBaseRelationsList(
        databaseId,
        this.engine,
        forceReload,
      );

      if (error) {
        rootNode.children = [this.makeErrorNode(rootNode.id, error)];
      } else if (isLoading && !baseRelations.length) {
        rootNode.children = [this.makeLoadingNode(rootNode.id)];
      } else if (baseRelations) {
        rootNode.children = sortBy(baseRelations, 'name').map(baseRelation => {
          return {
            id: this.generateNodeId({
              type: 'base-relation',
              databaseId,
              name: baseRelation.name,
            }),
            name: baseRelation.name,
            data: {
              type: 'base-relation',
              name: baseRelation.name,
              databaseId,
            },
          };
        });
      }
    }

    return rootNode;
  }

  private buildModelNodes(databaseId: string, forceReload: boolean) {
    const rootNode: TreeViewNode = {
      id: this.generateNodeId({ type: 'model-root', databaseId }),
      name: 'Models',
      data: { type: 'model-root', errorCount: 0, databaseId },
    };

    rootNode.hasChildren = !this.openedNodes[rootNode.id];

    if (this.openedNodes[rootNode.id]) {
      const {
        error,
        isLoading,
        models,
        definitions,
        isLoaded,
      } = this.syncStore.getModelsList(databaseId, this.engine, forceReload);

      if (error) {
        rootNode.children = [this.makeErrorNode(rootNode.id, error)];
      } else if (isLoading && !isLoaded) {
        rootNode.children = [this.makeLoadingNode(rootNode.id)];
      } else if (models) {
        const modelTree = convertToTree(models, defsToIdbsByModel(definitions));

        rootNode.children = modelTree.map(n =>
          this.convertNode(n, rootNode, databaseId),
        );
      }
    }

    return rootNode;
  }

  private convertNode(
    n: ModelNode<Model>,
    parent: TreeViewNode,
    databaseId: string,
  ) {
    let node: TreeViewNode = {
      id: this.generateNodeId({
        type: 'model-folder',
        databaseId,
        name: n.path,
      }),
      name: n.name,
      data: {
        type: 'model-folder',
        folder: n.path,
        errorCount: 0,
        databaseId: databaseId,
      },
    };

    if (n.model) {
      node = {
        id: this.generateNodeId({
          type: 'model',
          databaseId,
          name: n.path,
        }),
        name: n.name,
        data: {
          type: 'model',
          model: n.model,
          errorCount: n.model.errorCount || 0,
          databaseId: databaseId,
        },
      };
    }

    if (n.idb) {
      node = {
        id: this.generateNodeId({
          type: 'idb',
          databaseId,
          name: n.path,
        }),
        name: n.name,
        data: {
          type: 'idb',
          idb: n.idb,
          databaseId: databaseId,
        },
      };
    }

    if (n.children && n.children.length > 0) {
      node.children = n.children.map(n =>
        this.convertNode(n, node, databaseId),
      );
    } else {
      node.children = undefined;
    }

    if (parent && 'errorCount' in parent.data && 'errorCount' in node.data) {
      parent.data.errorCount += node.data.errorCount || 0;
    }

    return node;
  }

  private makeErrorNode(
    parentNodeId: string,
    error?: Error,
    name = 'Failed to load.',
  ) {
    const node: TreeViewNode = {
      id: this.generateNodeId({ type: 'error', parentNodeId }),
      name,
      data: { type: 'error', error },
    };

    return node;
  }

  private makeLoadingNode(parentNodeId: string) {
    const node: TreeViewNode = {
      id: this.generateNodeId({ type: 'loading', parentNodeId }),
      name: 'Loading...',
      data: { type: 'loading' },
    };

    return node;
  }

  reloadData(forceReload: {
    models?: boolean;
    baseRelations?: boolean;
    databases?: boolean;
  }) {
    this.buildDatabasesNodes(forceReload);
  }

  setDbSearchTerm(term: string) {
    this.dbSearchTerm = term;
  }
}
