import { EditorStore } from './EditorStore';

type EditorStoreMock = Pick<EditorStore, keyof EditorStore>;

export function createEditorStoreMock(
  mockValues: Partial<EditorStoreMock> = {},
) {
  const mock: EditorStoreMock = {
    accountId: '',
    tabs: [],
    isLeftPanelShown: true,
    isBottomPanelShown: true,
    bottomPanelFlex: undefined,
    leftPanelFlex: undefined,
    selectedTab: undefined,
    isLoading: false,
    isLoaded: false,
    visibleDatabase: '',
    visibleEngine: '',
    skaffoldEngine: '',
    selectedBottomTab: '',
    setVisibleDatabase: jest.fn(),
    setVisibleEngine: jest.fn(),
    loadTabs: jest.fn(),
    addTab: jest.fn(),
    selectTab: jest.fn(),
    selectBottomTab: jest.fn(),
    closeTab: jest.fn(),
    changeTabs: jest.fn(),
    toggleBottomPanelShown: jest.fn(),
    toggleLeftPanelShown: jest.fn(),
    setBottomPanelFlex: jest.fn(),
    setLeftPanelFlex: jest.fn(),
    patchNames: jest.fn(),
    renameModelTab: jest.fn(),
    closeWorksheetTab: jest.fn(),
    closeModelTab: jest.fn(),
    closeBaseRelationTab: jest.fn(),
    resetBottomTabs: jest.fn(),
    setSkaffoldEngine: jest.fn(),
    ...mockValues,
  };

  return mock as EditorStore;
}
