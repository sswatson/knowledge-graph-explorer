import { TreeViewStore } from './treeViewStore';

type TreeViewStoreMock = Pick<TreeViewStore, keyof TreeViewStore>;

export function createTreeViewStoreMock(
  mockValues: Partial<TreeViewStoreMock> = {},
) {
  const mock: TreeViewStoreMock = {
    treeData: [],
    openedNodes: {},
    context: {
      accountId: '',
    },
    accountId: '',
    engine: '',
    dbSearchTerm: '',
    generateNodeId: jest.fn(),
    setOpenedNodes: jest.fn(),
    setEngine: jest.fn(),
    setOpenDatabaseNodes: jest.fn(),
    reloadData: jest.fn(),
    setDbSearchTerm: jest.fn(),
    ...mockValues,
  };

  return mock as TreeViewStore;
}
