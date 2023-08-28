import { createClientListStoreMock } from '../client/clientListStoreMock';
import { createClientMock } from '../clientMock';
import { createDatabaseListStoreMock } from '../database/databaseListStoreMock';
import { createEditorStoreMock } from '../editor/EditorStoreMock';
import { createEngineStoreMock } from '../engines/engineStoreMock';
import { createRoleListStoreMock } from '../roles/roleListStoreMock';
import { createTransactionListStoreMock } from '../transactions/transactionListStoreMock';
import { createTreeViewStoreMock } from '../treeview/treeViewStoreMock';
import { createUserListStoreMock } from '../users/userListStoreMock';
import { createWorksheetListStoreMock } from '../worksheets/worksheetListStoreMock';
import { createAccountListStoreMock } from './accounstListStoreMock';
import { AccountStore } from './accountStore';
import { createIdProviderListStoreMock } from './idProviderListStoreMock';
import { createPermissionListStoreMock } from './permissionListStoreMock';

type AccountStoreMock = Pick<AccountStore, keyof AccountStore>;

export function createAccountStoreMock(
  mockValues: Partial<AccountStoreMock> = {},
) {
  const mock: AccountStoreMock = {
    accountId: '',
    transactionStores: {},
    clientListStore: createClientListStoreMock(),
    databaseListStore: createDatabaseListStoreMock(),
    editorStore: createEditorStoreMock(),
    engineStore: createEngineStoreMock(),
    permissionListStore: createPermissionListStoreMock(),
    roleListStore: createRoleListStoreMock(),
    transactionListStore: createTransactionListStoreMock(),
    treeViewStore: createTreeViewStoreMock(),
    userListStore: createUserListStoreMock(),
    worksheetListStore: createWorksheetListStoreMock(),
    idProviderListStore: createIdProviderListStoreMock(),
    accountListStore: createAccountListStoreMock(),
    setContext: jest.fn(),
    request: jest.fn(),
    getBaseRelationListStore: jest.fn(),
    getClientListStore: jest.fn(),
    getDatabaseListStore: jest.fn(),
    getEditorStore: jest.fn(),
    getModelListStore: jest.fn(),
    getModelStore: jest.fn(),
    getPermissionListStore: jest.fn(),
    getRoleListStore: jest.fn(),
    getTransactionListStore: jest.fn(),
    getTransactionStore: jest.fn(),
    getUserListStore: jest.fn(),
    getWorksheetListStore: jest.fn(),
    getWorksheetStore: jest.fn(),
    getTreeViewStore: jest.fn(),
    getIdProviderListStore: jest.fn(),
    getAccountListStore: jest.fn(),
    context: {
      accountId: '',
      flags: {},
      getToken: jest.fn(),
      client: createClientMock(),
      userId: '',
    },
    ...mockValues,
  };

  return mock as AccountStore;
}
