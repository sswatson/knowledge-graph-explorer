import { debounce, differenceBy, keyBy } from 'lodash-es';
import { makeAutoObservable, reaction, runInAction } from 'mobx';

import { SyncStore } from '../accounts/syncStore';

type WorksheetTab = {
  id: string;
  name: string;
  type: 'WORKSHEET';
  worksheetId: string;
  selectedBottomTab?: string;
};

type ModelTab = {
  id: string;
  name: string;
  type: 'MODEL';
  modelName: string;
  isPending?: boolean;
  databaseName: string;
  selectedBottomTab?: string;
};

export type BaseRelationTab = {
  id: string;
  name: string;
  baseRelationName: string;
  type: 'BASE_RELATION';
  databaseName: string;
  selectedBottomTab?: string;
};

export type EditorTab = WorksheetTab | ModelTab | BaseRelationTab;

export type EditorState = {
  tabs: EditorTab[];
  selectedTabId?: string;
  isBottomPanelShown: boolean;
  isLeftPanelShown: boolean;
  leftPanelFlex?: number;
  bottomPanelFlex?: number;
  skaffoldEngine?: string;
  history: string[];
};

export const EDITOR_STATE_KEY = 'EDITOR_STATE';
export const SAVE_DEBOUNCE_PERIOD_MS = 1000;
const INITIAL_STATE: EditorState = {
  tabs: [],
  isBottomPanelShown: true,
  isLeftPanelShown: true,
  history: [],
};

export class EditorStore {
  error?: Error = undefined;
  isLoading = false;
  isLoaded = false;
  visibleEngine = '';
  visibleDatabase = '';

  private syncStore: SyncStore;
  private state: EditorState = INITIAL_STATE;

  constructor(syncStore: SyncStore, public accountId: string) {
    this.syncStore = syncStore;
    makeAutoObservable<EditorStore>(this);
    // this reaction deletes the base relation store in order to trigger a reload when the tab is opened again.
    reaction(
      () => this.tabs,
      (currentTabs, prevTabs) => {
        differenceBy(prevTabs, currentTabs, t => t.id).forEach(t => {
          if (t.type === 'BASE_RELATION') {
            // TODO: find a way to delete the store without timout
            // The reason for using a timeout is to allow enough time for components to re-render before store deletion.
            // This is important to prevent the store from being recreated after deletion during the re-rendering process.
            setTimeout(() => {
              syncStore.deleteBaseRelationStore(
                t.databaseName,
                t.baseRelationName,
              );
            }, 1000);
          }
        });
      },
    );
  }

  setVisibleEngine(engine: string) {
    this.visibleEngine = engine;
  }

  setVisibleDatabase(database: string) {
    this.visibleDatabase = database;
  }

  get selectedTab(): EditorTab | undefined {
    return this.state.tabs.find(tab => tab.id === this.state.selectedTabId);
  }

  get tabs(): EditorTab[] {
    return this.state.tabs.map(t => {
      if (t.type === 'MODEL') {
        return {
          ...t,
          name: t.modelName.slice(t.modelName.lastIndexOf('/') + 1),
          isPending: this.syncStore.isDatabaseModelDirty(
            t.databaseName,
            t.modelName,
          ),
        };
      }

      return t;
    });
  }

  changeTabs(tabIds: string[]) {
    this.state.tabs = tabIds
      .map(tabId => this.state.tabs.find(tab => tab.id === tabId))
      .filter<EditorTab>(
        (tab: EditorTab | undefined): tab is EditorTab => tab !== undefined,
      );

    if (tabIds.length > 0 && !tabIds.includes(this.state.selectedTabId ?? '')) {
      this.selectTab();
    }

    this.save();
  }

  get isBottomPanelShown() {
    return this.state.isBottomPanelShown;
  }

  get isLeftPanelShown() {
    return this.state.isLeftPanelShown;
  }

  get bottomPanelFlex(): number | undefined {
    return this.state.bottomPanelFlex;
  }

  get leftPanelFlex(): number | undefined {
    return this.state.leftPanelFlex;
  }

  get skaffoldEngine() {
    return this.state.skaffoldEngine;
  }

  private getStorageKey() {
    return `${EDITOR_STATE_KEY}-${this.accountId}`;
  }

  private async saveState() {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
  }

  private save = debounce(this.saveState, SAVE_DEBOUNCE_PERIOD_MS);

  private async getState(): Promise<EditorState | undefined> {
    try {
      const stateStr =
        typeof window !== 'undefined' &&
        localStorage.getItem(this.getStorageKey());

      if (stateStr) {
        return JSON.parse(stateStr) as EditorState;
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
      });
    }
  }

  async loadTabs() {
    if (this.isLoading || this.isLoaded) {
      return;
    }

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const localState = await this.getState();

      runInAction(() => {
        this.isLoaded = true;
        this.isLoading = false;
        this.state = {
          ...INITIAL_STATE,
          ...localState,
        };
      });
    } catch (error: any) {
      runInAction(() => {
        this.isLoading = false;
        this.error = error;
      });
    }
  }

  addTab(tab: EditorTab, shouldSelect = true) {
    const existingTab = this.tabs.find(t => isTabEqual(t, tab));

    if (!existingTab) {
      this.state.tabs.push(tab);
    }

    if (shouldSelect) {
      this.selectTab(existingTab?.id ?? tab.id);
    }

    this.save();
  }

  selectTab(tabId?: string) {
    const idMap = keyBy(this.state.tabs, 'id');

    this.state.history = this.state.history.filter(id => idMap[id]);

    if (!tabId) {
      tabId = this.state.history.pop();
    }

    if (!tabId && this.state.tabs.length) {
      tabId = this.state.tabs[this.state.tabs.length - 1].id;
    }

    if (tabId && this.state.history[this.state.history.length - 1] !== tabId) {
      this.state.history.push(tabId);
    }

    this.state.selectedTabId = tabId;
    this.save();
  }

  get selectedBottomTab() {
    if (this.selectedTab?.selectedBottomTab) {
      return this.selectedTab.selectedBottomTab;
    }

    return 'output';
  }

  selectBottomTab(bottomTabId: string) {
    const selectedTabIndex = this.tabs.findIndex(
      t => t.id === this.state.selectedTabId,
    );

    if (selectedTabIndex >= 0) {
      this.state.tabs[selectedTabIndex].selectedBottomTab = bottomTabId;

      this.state.isBottomPanelShown = true;
    }

    this.save();
  }

  closeTab(tabId: string) {
    this.changeTabs(
      this.state.tabs.filter(tab => tab.id !== tabId).map(tab => tab.id),
    );
  }

  toggleBottomPanelShown() {
    this.state.isBottomPanelShown = !this.state.isBottomPanelShown;
    this.save();
  }

  toggleLeftPanelShown() {
    this.state.isLeftPanelShown = !this.state.isLeftPanelShown;
    this.save();
  }

  setBottomPanelFlex(flex: number) {
    this.state.bottomPanelFlex = flex;
    this.save();
  }

  setLeftPanelFlex(flex: number) {
    this.state.leftPanelFlex = flex;
    this.save();
  }

  patchNames(namesMap: Record<string, string>) {
    this.state.tabs.forEach(tab => {
      const name = namesMap[tab.id];

      if (name && name && tab.name !== name) {
        tab.name = name;
      }
    });
  }

  renameModelTab(
    databaseName: string,
    modelName: string,
    newModelName: string,
  ) {
    const index = this.state.tabs.findIndex(
      t =>
        t.type === 'MODEL' &&
        t.databaseName === databaseName &&
        t.modelName === modelName,
    );
    const tab = this.state.tabs[index];

    if (tab?.type === 'MODEL') {
      this.state.tabs[index] = {
        ...tab,
        modelName: newModelName,
      };

      this.save();
    }
  }

  closeWorksheetTab(worksheetId: string) {
    const tab = this.state.tabs.find(
      t => t.type === 'WORKSHEET' && t.worksheetId === worksheetId,
    );

    if (tab) {
      this.closeTab(tab.id);
    }
  }

  closeModelTab(databaseName: string, modelName: string) {
    const tab = this.state.tabs.find(
      t =>
        t.type === 'MODEL' &&
        t.databaseName === databaseName &&
        t.modelName === modelName,
    );

    if (tab) {
      this.closeTab(tab.id);
    }
  }

  closeBaseRelationTab(databaseName: string, baseRelation: string) {
    const tab = this.state.tabs.find(
      t =>
        t.type === 'BASE_RELATION' &&
        t.databaseName === databaseName &&
        t.name === baseRelation,
    );

    if (tab) {
      this.closeTab(tab.id);
    }
  }

  resetBottomTabs(bottomTabId: string, resetValue = 'output') {
    this.state.tabs
      .filter(tab => tab.selectedBottomTab === bottomTabId)
      .forEach(tab => (tab.selectedBottomTab = resetValue));

    this.save();
  }

  setSkaffoldEngine(engineName: string) {
    this.state.skaffoldEngine = engineName;
    this.save();
  }
}

function isTabEqual(tabA: EditorTab, tabB: EditorTab) {
  if (tabA.type === 'WORKSHEET' && tabB.type === 'WORKSHEET') {
    return tabA.worksheetId === tabB.worksheetId;
  }

  if (tabA.type === 'MODEL' && tabB.type === 'MODEL') {
    return (
      tabA.modelName === tabB.modelName &&
      tabA.databaseName === tabB.databaseName
    );
  }

  if (tabA.type === 'BASE_RELATION' && tabB.type === 'BASE_RELATION') {
    return (
      tabA.baseRelationName === tabB.baseRelationName &&
      tabA.databaseName === tabB.databaseName
    );
  }

  return false;
}
