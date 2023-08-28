import { configure } from 'mobx';

import { createSyncStoreMock } from '../accounts/syncStoreMock';
import {
  EDITOR_STATE_KEY,
  EditorState,
  EditorStore,
  EditorTab,
  SAVE_DEBOUNCE_PERIOD_MS,
} from './EditorStore';

const accountId = 'accountId';

const editorStateMock: EditorState = {
  tabs: [
    {
      id: 'id1',
      name: 'worksheetName',
      type: 'WORKSHEET',
      worksheetId: 'worksheetId',
      selectedBottomTab: 'output',
    },
    {
      id: 'id2',
      type: 'MODEL',
      isPending: false,
      name: 'modelName',
      modelName: 'modelName',
      databaseName: 'databaseName',
      selectedBottomTab: 'problems',
    },
    {
      id: 'id3',
      type: 'MODEL',
      isPending: false,
      name: 'modelName2',
      modelName: 'modelName2',
      databaseName: 'databaseName',
      selectedBottomTab: 'baseRelation-databaseId-baseRelation1',
    },
    {
      id: 'id4',
      name: 'baseRelation1',
      baseRelationName: 'baseRelation1',
      type: 'BASE_RELATION',
      databaseName: 'databaseName',
      selectedBottomTab: 'problems',
    },
    {
      id: 'id5',
      name: 'baseRelation2',
      baseRelationName: 'baseRelation2',
      type: 'BASE_RELATION',
      databaseName: 'databaseName',
      selectedBottomTab: 'output',
    },
  ],
  selectedTabId: 'id2',
  isBottomPanelShown: false,
  isLeftPanelShown: false,
  skaffoldEngine: 'foo',
  history: [],
};

const syncStoreMock = createSyncStoreMock({
  isDatabaseModelDirty: jest.fn().mockReturnValue(false),
});

describe('EditorStore', () => {
  beforeAll(() => {
    // to dislable MobX warnings
    // because we set fields directly like
    // store['state'] = foo
    configure({ enforceActions: 'never' });
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    localStorage.restore();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should set visible engine', async () => {
    const store = new EditorStore(syncStoreMock, accountId);

    expect(store.visibleEngine).toEqual('');

    store.setVisibleEngine('foo');

    expect(store.visibleEngine).toEqual('foo');
  });

  it('should set visible database', async () => {
    const store = new EditorStore(syncStoreMock, accountId);

    expect(store.visibleDatabase).toEqual('');

    store.setVisibleDatabase('foo');

    expect(store.visibleDatabase).toEqual('foo');
  });

  it('should get tabs', async () => {
    const store = new EditorStore(syncStoreMock, accountId);
    const tabs = [
      {
        id: 'id1',
        name: 'worksheetName',
        type: 'WORKSHEET',
        worksheetId: 'worksheetId',
        selectedBottomTab: 'output',
      },
      {
        id: 'id2',
        name: 'folder/modelName',
        type: 'MODEL',
        isPending: false,
        modelName: 'folder/modelName',
        databaseName: 'databaseName',
        selectedBottomTab: 'problems',
      },
    ] as EditorTab[];

    store['state'] = {
      tabs: [...tabs],
      selectedTabId: 'id2',
      isBottomPanelShown: false,
      isLeftPanelShown: false,
      history: [],
    };

    expect(store.tabs).toEqual([
      tabs[0],
      {
        ...tabs[1],
        name: 'modelName',
      },
    ]);
  });

  it('should get tab with pending changes', async () => {
    const syncStoreMock = createSyncStoreMock({
      isDatabaseModelDirty: jest.fn().mockReturnValue(true),
    });
    const store = new EditorStore(syncStoreMock, accountId);
    const tabs = [
      {
        id: 'id1',
        name: 'foo',
        type: 'MODEL',
        modelName: 'foo',
        databaseName: 'databaseName',
        selectedBottomTab: 'problems',
      },
    ] as EditorTab[];

    store['state'] = {
      tabs: [...tabs],
      selectedTabId: 'id1',
      isBottomPanelShown: false,
      isLeftPanelShown: false,
      history: [],
    };

    expect(store.tabs).toEqual([
      {
        ...tabs[0],
        isPending: true,
      },
    ]);
  });

  it('should load tabs', async () => {
    jest
      .spyOn(localStorage, 'getItem')
      .mockReturnValue(JSON.stringify(editorStateMock));

    const store = new EditorStore(syncStoreMock, accountId);
    const loadPromise = store.loadTabs();

    expect(store.isLoading).toStrictEqual(true);
    expect(store.error).toBeUndefined();
    expect(store.tabs).toStrictEqual([]);

    await loadPromise;

    expect(store.isLoading).toStrictEqual(false);
    expect(store.isLoaded).toStrictEqual(true);
    expect(store.tabs).toStrictEqual(editorStateMock.tabs);
    expect(store.selectedTab).toStrictEqual(editorStateMock.tabs[1]);
    expect(store.isBottomPanelShown).toStrictEqual(
      editorStateMock.isBottomPanelShown,
    );
    expect(store.isLeftPanelShown).toStrictEqual(
      editorStateMock.isLeftPanelShown,
    );
  });

  it('should handle load error', async () => {
    const loadError = new Error('Load Error');

    const store = new EditorStore(syncStoreMock, accountId);

    jest
      .spyOn(EditorStore.prototype as any, 'getState')
      .mockRejectedValue(loadError);
    const loadPromise = store.loadTabs();

    expect(store.isLoading).toStrictEqual(true);
    expect(store.error).toBeUndefined();

    await loadPromise;

    expect(store.isLoading).toStrictEqual(false);
    expect(store.error).toStrictEqual(loadError);
  });

  it('should save state', async () => {
    const setItemMock = jest.spyOn(localStorage, 'setItem');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    await store['saveState']();
    expect(setItemMock).toHaveBeenCalledWith(
      `${EDITOR_STATE_KEY}-${accountId}`,
      JSON.stringify(editorStateMock),
    );
  });

  it('should add new tab', () => {
    const newTab: EditorTab = {
      id: 'newTab',
      name: 'newWorksheetName',
      type: 'WORKSHEET',
      worksheetId: 'newWorksheet',
      selectedBottomTab: 'output',
    };

    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store.addTab(newTab);

    expect(store.tabs).toStrictEqual([newTab]);
    expect(saveStateMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should not allow duplicates when adding new tab', () => {
    const newTab: EditorTab = {
      id: 'foo',
      name: 'newWorksheetName',
      type: 'WORKSHEET',
      worksheetId: 'newWorksheet',
    };
    const newTab2: EditorTab = {
      id: 'newTab',
      name: 'newWorksheetName2',
      type: 'WORKSHEET',
      worksheetId: 'newWorksheet',
    };

    const newModelTab: EditorTab = {
      id: 'bar',
      name: 'modelName',
      type: 'MODEL',
      isPending: false,
      modelName: 'modelName',
      databaseName: 'dbName',
    };
    const newModelTab2: EditorTab = {
      id: 'newTab2',
      name: 'modelName2',
      type: 'MODEL',
      isPending: false,
      modelName: 'modelName',
      databaseName: 'dbName',
    };

    const store = new EditorStore(syncStoreMock, accountId);

    store.addTab(newTab);
    store.addTab(newTab2);

    expect(store.tabs).toStrictEqual([newTab]);

    store.addTab(newModelTab);
    store.addTab(newModelTab2);

    expect(store.tabs).toEqual([newTab, newModelTab]);
  });

  it('should select tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;
    const newTabId = 'id1';

    store.selectTab(newTabId);

    expect(store.selectedTab).toStrictEqual(editorStateMock.tabs[0]);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should close current tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.closeTab('id2');

    expect(store.tabs).toStrictEqual([
      editorStateMock.tabs[0],
      editorStateMock.tabs[2],
      editorStateMock.tabs[3],
      editorStateMock.tabs[4],
    ]);
    expect(store.selectedTab).toStrictEqual(editorStateMock.tabs[4]);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should call deleteBaseRelation when the base relation tab is closed', () => {
    const deleteBaseRelationStoreMock = jest.fn();
    const store = new EditorStore(
      createSyncStoreMock({
        isDatabaseModelDirty: jest.fn().mockReturnValue(false),
        deleteBaseRelationStore: deleteBaseRelationStoreMock,
      }),
      accountId,
    );

    store['state'] = editorStateMock;

    store.closeTab('id4');

    expect(store.tabs).toStrictEqual([
      editorStateMock.tabs[0],
      editorStateMock.tabs[1],
      editorStateMock.tabs[2],
      editorStateMock.tabs[4],
    ]);
    jest.advanceTimersByTime(1000);

    expect(deleteBaseRelationStoreMock).toHaveBeenCalledTimes(1);
    expect(deleteBaseRelationStoreMock).toHaveBeenCalledWith(
      'databaseName',
      'baseRelation1',
    );
  });

  it('should close other tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.closeTab('id1');

    expect(store.tabs).toStrictEqual([
      editorStateMock.tabs[1],
      editorStateMock.tabs[2],
      editorStateMock.tabs[3],
      editorStateMock.tabs[4],
    ]);
    expect(store.selectedTab).toStrictEqual(editorStateMock.tabs[1]);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should change tabs', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;
    store.changeTabs(['id2', 'id1']);
    expect(store.tabs).toStrictEqual([
      editorStateMock.tabs[1],
      editorStateMock.tabs[0],
    ]);

    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);
    expect(store.selectedTab).toStrictEqual(editorStateMock.tabs[1]);

    store.changeTabs(['id1']);

    expect(store.tabs).toStrictEqual([editorStateMock.tabs[0]]);
    expect(store.selectedTab).toStrictEqual(editorStateMock.tabs[0]);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should toggle bottom panel shown', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    expect(store.isBottomPanelShown).toStrictEqual(true);
    store.toggleBottomPanelShown();

    expect(store.isBottomPanelShown).toStrictEqual(false);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
    store.toggleBottomPanelShown();

    expect(store.isBottomPanelShown).toStrictEqual(true);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalledTimes(2);
  });

  it('should toggle left panel shown', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    expect(store.isLeftPanelShown).toStrictEqual(true);
    store.toggleLeftPanelShown();

    expect(store.isLeftPanelShown).toStrictEqual(false);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
    store.toggleLeftPanelShown();

    expect(store.isLeftPanelShown).toStrictEqual(true);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalledTimes(2);
  });

  it('should set bottom panel flex', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    expect(store.bottomPanelFlex).toBeUndefined();
    store.setBottomPanelFlex(0.4);

    expect(store.bottomPanelFlex).toStrictEqual(0.4);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should set left panel flex', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    expect(store.leftPanelFlex).toBeUndefined();
    store.setLeftPanelFlex(0.5);

    expect(store.leftPanelFlex).toStrictEqual(0.5);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should patch names', () => {
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    const map = {
      id1: 'test1',
      id2: 'test2',
    };

    const newEditorState: EditorState = {
      ...editorStateMock,
      tabs: [
        {
          id: 'id1',
          name: 'test1',
          type: 'WORKSHEET',
          worksheetId: 'worksheetId',
          selectedBottomTab: 'output',
        },
        {
          id: 'id2',
          name: 'test2',
          type: 'MODEL',
          isPending: false,
          modelName: 'modelName',
          databaseName: 'databaseName',
          selectedBottomTab: 'problems',
        },
        ...editorStateMock.tabs.slice(2),
      ],
    };

    store.patchNames(map);

    expect(store['state']).toStrictEqual(newEditorState);
  });

  it('should select bottom tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.selectBottomTab('output');

    expect(store.selectedBottomTab).toStrictEqual('output');
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);
    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should open bottom panel if it is closed when selecting bottom tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;
    expect(store.isBottomPanelShown).toStrictEqual(false);

    store.selectBottomTab('output');

    expect(store.selectedBottomTab).toStrictEqual('output');
    expect(store.isBottomPanelShown).toStrictEqual(true);

    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);
    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should return `output` as default selected bottom tab', () => {
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = {
      tabs: [
        {
          id: 'id1',
          name: 'test1',
          type: 'WORKSHEET',
          worksheetId: 'worksheetId',
        },
      ],
      selectedTabId: 'id1',
      isBottomPanelShown: false,
      isLeftPanelShown: false,
      history: [],
    };

    expect(store.selectedBottomTab).toStrictEqual('output');
  });

  it('should close worksheet tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.closeWorksheetTab('worksheetId');

    expect(store.tabs).toEqual([
      editorStateMock.tabs[1],
      editorStateMock.tabs[2],
      editorStateMock.tabs[3],
      editorStateMock.tabs[4],
    ]);
    expect(store.selectedTab).toEqual(editorStateMock.tabs[1]);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should close model tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.closeModelTab('databaseName', 'modelName');

    expect(store.tabs).toEqual([
      editorStateMock.tabs[0],
      editorStateMock.tabs[2],
      editorStateMock.tabs[3],
      editorStateMock.tabs[4],
    ]);
    expect(store.selectedTab).toEqual(editorStateMock.tabs[4]);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should close base relation tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.closeBaseRelationTab('databaseName', 'baseRelation1');

    expect(store.tabs).toEqual([
      editorStateMock.tabs[0],
      editorStateMock.tabs[1],
      editorStateMock.tabs[2],
      editorStateMock.tabs[4],
    ]);
    expect(store.selectedTab).toEqual(editorStateMock.tabs[1]);
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should rename model tab', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.renameModelTab('databaseName', 'modelName', 'foo/newName');

    expect(store.tabs[1]).toEqual({
      ...editorStateMock.tabs[1],
      name: 'newName',
      modelName: 'foo/newName',
    });
    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should reset bottom tabs', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.resetBottomTabs('baseRelation-databaseId-baseRelation1');

    expect(store.tabs).toStrictEqual([
      editorStateMock.tabs[0],
      editorStateMock.tabs[1],
      {
        ...editorStateMock.tabs[2],
        selectedBottomTab: 'output',
      },
      editorStateMock.tabs[3],
      editorStateMock.tabs[4],
    ]);

    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should get skaffold engine', async () => {
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    expect(store.skaffoldEngine).toEqual('foo');
  });

  it('should set skaffold engine', () => {
    const saveStateMock = jest.spyOn(EditorStore.prototype as any, 'saveState');
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.setSkaffoldEngine('bar');

    expect(store.skaffoldEngine).toEqual('bar');

    jest.advanceTimersByTime(SAVE_DEBOUNCE_PERIOD_MS);

    expect(saveStateMock).toHaveBeenCalled();
  });

  it('should preserve tab history', async () => {
    const store = new EditorStore(syncStoreMock, accountId);

    store['state'] = editorStateMock;

    store.selectTab('id1');
    store.selectTab('id1');
    store.selectTab('id2');
    store.selectTab('id4');
    store.selectTab('id1');

    expect(store['state'].history).toEqual(['id1', 'id2', 'id4', 'id1']);

    store.changeTabs(['id2', 'id3', 'id4']);

    expect(store['state'].history).toEqual(['id2', 'id4']);
    expect(store.selectedTab?.id).toEqual('id4');
  });
});
