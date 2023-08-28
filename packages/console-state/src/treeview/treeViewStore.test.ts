import { waitFor } from '@testing-library/react';

import { RelDefinition } from '@relationalai/editor-extensions';
import { Database, Model, SdkError } from '@relationalai/rai-sdk-javascript';

import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { BaseRelation } from '../database/baseRelationListStore';
import { mockBaseRelation } from '../database/baseRelationListStoreMock';
import { mockDatabase } from '../database/databaseListStoreMock';
import { TreeViewStore } from './treeViewStore';

const createTreeViewStore = ({
  engine,
  databases,
  models,
  baseRelations,
}: {
  engine?: string;
  databases?: {
    isLoading: boolean;
    databases: Database[];
    error: SdkError | undefined;
  };
  models?: {
    isLoading: boolean;
    isLoaded: boolean;
    error: SdkError | undefined;
    models: Model[];
    definitions: RelDefinition[];
  };
  baseRelations?: {
    isLoading: boolean;
    error: SdkError | undefined;
    baseRelations: BaseRelation[];
  };
}) => {
  const syncStoreMock = createSyncStoreMock();

  databases && (syncStoreMock.getDatabasesList = () => databases);
  models && (syncStoreMock.getModelsList = () => models);
  baseRelations && (syncStoreMock.getBaseRelationsList = () => baseRelations);
  const treeViewStore = new TreeViewStore(syncStoreMock, 'accountId');

  engine && treeViewStore.setEngine(engine);
  treeViewStore.openedNodes['$database-root'] = true;

  return treeViewStore;
};

describe('TreeViewStore', () => {
  it('should have error node when engine not selected', () => {
    const treeViewStore = createTreeViewStore({});
    const treeData = treeViewStore.treeData;

    // check root node of type 'schema'
    expect(treeData.length).toEqual(1);
    expect(treeData[0].data.type).toEqual('database-root');

    // check for 'select engine' error node
    const children = treeData[0].children;

    expect(children).toBeDefined();
    expect(children?.length).toEqual(1);
    expect(children && children[0].data.type).toEqual('error');
    expect(children && children[0].name).toEqual('Select engine');
  });

  it('should open the root node by default', () => {
    const treeViewStore = createTreeViewStore({});
    const treeData = treeViewStore.treeData;

    const rootNode = treeData[0];

    expect(treeViewStore.openedNodes[rootNode.id]).toBeTruthy();
  });

  it('should open db and models node when setOpenDatabaseNodes called', () => {
    const treeViewStore = createTreeViewStore({});

    treeViewStore.setOpenDatabaseNodes('my-db');
    expect(treeViewStore.openedNodes['$database-my-db']).toBeTruthy();
    expect(treeViewStore.openedNodes['$model-root-my-db']).toBeTruthy();
  });

  it('should change open node status when setOpenedNodes called', () => {
    const treeViewStore = createTreeViewStore({});
    const treeData = treeViewStore.treeData;

    const rootNode = treeData[0];
    const dummyNodeId = 'foo';

    expect(treeViewStore.openedNodes[rootNode.id]).toBeTruthy();
    expect(treeViewStore.openedNodes[dummyNodeId]).toBeFalsy();

    treeViewStore.setOpenedNodes({
      [rootNode.id]: false,
      [dummyNodeId]: true,
    });

    expect(treeViewStore.openedNodes[rootNode.id]).toBeFalsy();
    expect(treeViewStore.openedNodes[dummyNodeId]).toBeTruthy();
  });

  it('should set the engine value when setEngine is called', () => {
    const treeViewStore = createTreeViewStore({});

    expect(treeViewStore.engine).toEqual('');

    treeViewStore.setEngine('dummyEngineName');

    expect(treeViewStore.engine).toEqual('dummyEngineName');
  });

  it('should build databases nodes', () => {
    const databases = [
      mockDatabase({ name: 'foo' }),
      mockDatabase({ name: 'bar' }),
    ];

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases: {
        databases,
        isLoading: false,
        error: undefined,
      },
    });

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;

    expect(databasesNodes && databasesNodes.length).toEqual(2);

    const db1Node = databasesNodes && databasesNodes[0];
    const db2Node = databasesNodes && databasesNodes[1];

    expect(db1Node?.data.type).toEqual('database');
    expect(db1Node?.name).toEqual(databases[0].name);
    expect(db2Node?.data.type).toEqual('database');
    expect(db2Node?.name).toEqual(databases[1].name);
  });

  it('should build databases isLoading node', () => {
    const databases = {
      isLoading: true,
      error: undefined,
      databases: [],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
    });

    const treeData = treeViewStore.treeData;
    const loadingNode = treeData[0].children && treeData[0].children[0];

    expect(loadingNode?.name).toEqual('Loading...');
    expect(loadingNode?.data.type).toEqual('loading');
  });

  it('should build databases error node', () => {
    const databases = {
      isLoading: true,
      error: { name: 'error', message: 'loading databases failed' },
      databases: [],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
    });

    const treeData = treeViewStore.treeData;
    const errorNode = treeData[0].children && treeData[0].children[0];

    expect(errorNode?.name).toEqual('Failed to load.');
    expect(errorNode?.data.type).toEqual('error');
  });

  it('should not build models and base relations when database node is not opened', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' }), mockDatabase({ name: 'bar' })],
    };
    const models = {
      isLoading: true,
      isLoaded: false,
      models: [],
      error: undefined,
      definitions: [],
    };

    const baseRelations = {
      isLoading: true,
      baseRelations: [],
      error: undefined,
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
      models,
      baseRelations,
    });

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const db1Node = databasesNodes && databasesNodes[0];

    expect(db1Node?.children).toBeUndefined();
    expect(db1Node?.hasChildren).toBeTruthy();
  });

  it('should render `Models` and `BaseRelations` when database is opened', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' }), mockDatabase({ name: 'bar' })],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
    });

    treeViewStore.openedNodes['$database-foo'] = true;

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const dbNode = databasesNodes && databasesNodes[0];

    expect(dbNode?.children).toBeDefined();
    expect(dbNode?.children?.length).toEqual(2);
    expect(dbNode?.children && dbNode.children[0].name).toEqual(
      'Base Relations',
    );
    expect(dbNode?.children && dbNode.children[1].name).toEqual('Models');

    const baseRelationsNode = dbNode?.children && dbNode.children[0];
    const modelsNode = dbNode?.children && dbNode.children[1];

    expect(baseRelationsNode?.children).toBeUndefined();

    expect(modelsNode?.children).toBeUndefined();
  });

  it('should build models isLoading node', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' })],
    };
    const models = {
      isLoading: true,
      isLoaded: false,
      models: [],
      error: undefined,
      definitions: [],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
      models,
    });

    treeViewStore.openedNodes['$database-foo'] = true;
    treeViewStore.openedNodes['$model-root-foo'] = true;

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const dbNode = databasesNodes && databasesNodes[0];
    const modelsNode = dbNode?.children && dbNode.children[1];

    expect(modelsNode?.children?.length).toEqual(1);

    const loadingNode = modelsNode?.children && modelsNode?.children[0];

    expect(loadingNode?.name).toEqual('Loading...');
    expect(loadingNode?.data.type).toEqual('loading');
  });

  it('should build base relations isLoading node', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' })],
    };

    const baseRelations = {
      isLoading: true,
      baseRelations: [],
      error: undefined,
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
      baseRelations,
    });

    treeViewStore.openedNodes['$database-foo'] = true;
    treeViewStore.openedNodes['$base-relation-root-foo'] = true;

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const dbNode = databasesNodes && databasesNodes[0];
    const baseRelationsNode = dbNode?.children && dbNode.children[0];

    expect(baseRelationsNode?.children?.length).toEqual(1);

    const loadingNode =
      baseRelationsNode?.children && baseRelationsNode?.children[0];

    expect(loadingNode?.name).toEqual('Loading...');
    expect(loadingNode?.data.type).toEqual('loading');
  });

  it('should build models error node', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' })],
    };
    const models = {
      isLoading: false,
      isLoaded: true,
      models: [],
      error: { name: 'error', message: 'error from model store' },
      definitions: [],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
      models,
    });

    treeViewStore.openedNodes['$database-foo'] = true;
    treeViewStore.openedNodes['$model-root-foo'] = true;

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const dbNode = databasesNodes && databasesNodes[0];
    const modelsNode = dbNode?.children && dbNode.children[1];

    expect(modelsNode?.children?.length).toEqual(1);

    const errorNode = modelsNode?.children && modelsNode?.children[0];

    expect(errorNode?.name).toEqual('Failed to load.');
    expect(errorNode?.data.type).toEqual('error');
  });

  it('should base relations error node', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' })],
    };

    const baseRelations = {
      isLoading: false,
      baseRelations: [],
      error: { name: 'error', message: 'error from model store' },
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
      baseRelations,
    });

    treeViewStore.openedNodes['$database-foo'] = true;
    treeViewStore.openedNodes['$base-relation-root-foo'] = true;

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const dbNode = databasesNodes && databasesNodes[0];
    const baseRelationsNode = dbNode?.children && dbNode.children[0];

    expect(baseRelationsNode?.children?.length).toEqual(1);

    const errorNode =
      baseRelationsNode?.children && baseRelationsNode?.children[0];

    expect(errorNode?.name).toEqual('Failed to load.');
    expect(errorNode?.data.type).toEqual('error');
  });

  it('should build models nodes', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' })],
    };

    const models = {
      isLoading: false,
      isLoaded: true,
      models: [
        {
          name: 'folder/subFolder/model1',
          value: 'modelValue',
        },
        {
          name: 'folder/model2',
          value: 'modelValue',
        },
        {
          name: 'modelWithoutFolder',
          value: 'def idb = 1',
        },
      ],
      error: undefined,
      definitions: [
        {
          name: 'idb',
          type: 'relation' as const,
          reference: {
            name: 'modelWithoutFolder',
            type: 'model' as const,
            databaseName: 'foo',
            from: 4,
            to: 6,
            line: 1,
            column: 4,
          },
        },
      ],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
      models,
    });

    treeViewStore.openedNodes['$database-foo'] = true;
    treeViewStore.openedNodes['$model-root-foo'] = true;

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const dbNode = databasesNodes && databasesNodes[0];
    const modelsNode = dbNode?.children && dbNode.children[1];

    expect(modelsNode?.children?.length).toEqual(2);

    // should group models by path
    const folderNode = modelsNode?.children && modelsNode?.children[0];

    expect(folderNode?.name).toEqual('folder');
    expect(folderNode?.data.type).toEqual('model-folder');
    expect(folderNode?.children?.length).toEqual(2);
    expect(folderNode?.children && folderNode?.children[0].data.type).toEqual(
      'model-folder',
    );
    expect(folderNode?.children && folderNode?.children[1].data.type).toEqual(
      'model',
    );

    // should get model without folder
    const modelNode = modelsNode?.children && modelsNode?.children[1];

    expect(modelNode?.name).toEqual('modelWithoutFolder');
    expect(modelNode?.data.type).toEqual('model');
    expect(modelNode?.children?.length).toEqual(1);

    // should pass idbs
    const idbNode = modelNode?.children && modelNode?.children[0];

    expect(idbNode?.name).toEqual('idb');
    expect(idbNode?.data.type).toEqual('idb');
    expect(idbNode?.children).toBeUndefined();
  });

  it('should base relations nodes', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' })],
    };

    const baseRelations = {
      isLoading: true,
      baseRelations: [
        mockBaseRelation({ name: 'car' }),
        mockBaseRelation({ name: 'bar' }),
      ],

      error: undefined,
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
      baseRelations,
    });

    treeViewStore.openedNodes['$database-foo'] = true;
    treeViewStore.openedNodes['$base-relation-root-foo'] = true;

    const treeData = treeViewStore.treeData;
    const databasesNodes = treeData[0].children;
    const dbNode = databasesNodes && databasesNodes[0];
    const baseRelationsNode = dbNode?.children && dbNode.children[0];

    expect(baseRelationsNode?.children?.length).toEqual(2);
    const brNode1 =
      baseRelationsNode?.children && baseRelationsNode.children[0];

    expect(brNode1?.name).toEqual('bar'); // sorted alphabetically
    expect(brNode1?.data.type).toEqual('base-relation');
  });

  it('should re-call sync store functions when reload is called', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [mockDatabase({ name: 'foo' }), mockDatabase({ name: 'bar' })],
    };

    const models = {
      isLoading: false,
      models: [{ name: 'model', value: 'def a = 4' }],
      error: undefined,
    };

    const baseRelations = {
      isLoading: false,
      baseRelationList: [mockBaseRelation({ name: 'rel' })],
      error: undefined,
    };
    const syncStoreMock = createSyncStoreMock({
      getDatabasesList: jest.fn().mockReturnValue(databases),
      getModelsList: jest.fn().mockReturnValue(models),
      getBaseRelationsList: jest.fn().mockReturnValue(baseRelations),
    });

    const treeViewStore = new TreeViewStore(syncStoreMock, 'accountId');

    treeViewStore.setEngine('engine');

    treeViewStore.openedNodes['$database-foo'] = true;
    treeViewStore.openedNodes['$base-relation-root-foo'] = true;
    treeViewStore.openedNodes['$model-root-bar'] = true;

    treeViewStore.reloadData({
      models: true,
      baseRelations: true,
      databases: true,
    });

    waitFor(() => {
      expect(syncStoreMock.getDatabasesList).toHaveBeenCalledTimes(1);
      expect(syncStoreMock.getDatabasesList).toHaveBeenCalledWith(true);

      expect(syncStoreMock.getModelsList).toHaveBeenCalledTimes(1);
      expect(syncStoreMock.getModelsList).toHaveBeenCalledWith(
        'foo',
        'engine',
        true,
      );

      expect(syncStoreMock.getBaseRelationsList).toHaveBeenCalledTimes(1);
      expect(syncStoreMock.getBaseRelationsList).toHaveBeenCalledWith(
        'bar',
        'engine',
        true,
      );
    });
  });

  it('should set dbSearchTerm when setDbSearchTerm is called', () => {
    const treeViewStore = createTreeViewStore({});

    expect(treeViewStore.dbSearchTerm).toEqual('');

    treeViewStore.setDbSearchTerm('dummy search text');

    expect(treeViewStore.dbSearchTerm).toEqual('dummy search text');
  });

  it('should filter out databases based on dbSearchTerm', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [
        mockDatabase({ name: 'No T E R M' }),
        mockDatabase({ name: 'No ter m' }),
        mockDatabase({ name: 'TERM' }),
        mockDatabase({ name: 'termStart' }),
        mockDatabase({ name: 'something else' }),
        mockDatabase({ name: 'middle-term/middle' }),
        mockDatabase({ name: 'end_term' }),
        mockDatabase({ name: 'not-related' }),
      ],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
    });

    treeViewStore.dbSearchTerm = 'tErM';

    const treeData = treeViewStore.treeData;
    const databaseNodes = treeData[0].children;

    expect(databaseNodes).toBeDefined();
    expect(databaseNodes && databaseNodes.length).toEqual(4);
    expect(databaseNodes && databaseNodes[0].name).toEqual('TERM');
    expect(databaseNodes && databaseNodes[1].name).toEqual('termStart');
    expect(databaseNodes && databaseNodes[2].name).toEqual(
      'middle-term/middle',
    );
    expect(databaseNodes && databaseNodes[3].name).toEqual('end_term');
  });

  it('should filter out databases and return no databases found', () => {
    const databases = {
      isLoading: false,
      error: undefined,
      databases: [
        mockDatabase({ name: 'something else' }),
        mockDatabase({ name: 'not-related' }),
        mockDatabase({ name: 'foo' }),
        mockDatabase({ name: 'bar' }),
        mockDatabase({ name: 'boo' }),
      ],
    };

    const treeViewStore = createTreeViewStore({
      engine: 'engine',
      databases,
    });

    treeViewStore.dbSearchTerm = 'tErM';

    const treeData = treeViewStore.treeData;
    const childrenNodes = treeData[0].children;

    expect(childrenNodes).toBeDefined();
    expect(childrenNodes && childrenNodes.length).toEqual(1);
    expect(childrenNodes && childrenNodes[0].name).toEqual(
      'No Databases Found',
    );
  });
});
