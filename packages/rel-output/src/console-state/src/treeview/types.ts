import { Idb } from '@relationalai/utils';

import { Model } from '../models/modelStore';

export type TreeViewNode = {
  id: string;
  name: string;
  children?: TreeViewNode[];
  hasChildren?: boolean;
  data: TreeViewNodeData;
};

export type TreeViewContextData = {
  accountId: string;
};

export type TreeViewNodeData =
  | LoadingNodeData
  | ErrorNodeData
  | DatabaseRootNodeData
  | BaseRelationRootNodeData
  | BaseRelationNodeData
  | ModelRootNodeData
  | DatabaseNodeData
  | ModelFolderNodeData
  | ModelNodeData
  | IdbNodeData;

export type LoadingNodeData = {
  type: 'loading';
};

export type ErrorNodeData = {
  type: 'error';
  error?: Error;
};

export type DatabaseRootNodeData = {
  type: 'database-root';
};

export type DatabaseNodeData = {
  type: 'database';
  databaseId: string;
};

export type BaseRelationRootNodeData = {
  type: 'base-relation-root';
  databaseId: string;
};

export type BaseRelationNodeData = {
  type: 'base-relation';
  name: string;
  databaseId: string;
};

export type ModelRootNodeData = {
  type: 'model-root';
  errorCount: number;
  databaseId: string;
};

export type ModelFolderNodeData = {
  type: 'model-folder';
  folder: string;
  databaseId: string;
  errorCount: number;
};

export type ModelNodeData = {
  type: 'model';
  model: Model;
  databaseId: string;
  errorCount: number;
};

export type IdbNodeData = {
  type: 'idb';
  databaseId: string;
  idb: Idb;
};
