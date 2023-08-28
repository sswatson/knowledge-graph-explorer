import { localStorage } from '@shopify/jest-dom-mocks';
import { waitFor } from '@testing-library/react';
import { runInAction } from 'mobx';

import { createClientMock } from '../clientMock';
import { StoreContext } from '../types';
import { mockWorksheet } from '../worksheets/worksheetStoreMock';
import { AccountStore } from './accountStore';

describe('AccountStore', () => {
  const accountId = 'accId';

  function createAccountStore(contextValues: Partial<StoreContext> = {}) {
    const context = {
      accountId,
      getToken: () => Promise.resolve('token'),
      flags: {},
      userId: '',
      client: createClientMock(),
      ...contextValues,
    };

    return new AccountStore(context);
  }

  afterEach(() => {
    localStorage.restore();
  });

  it('should create engine store', () => {
    const store = createAccountStore();

    expect(store.engineStore).toBeDefined();
  });

  it('should get transaction list store', () => {
    const store = createAccountStore({ userId: 'usrId' });
    const transactionListStore = store.getTransactionListStore();

    expect(transactionListStore).toBeDefined();
    expect(transactionListStore.filters.created_by).toEqual(['usrId']);
  });

  it('should get transaction store', () => {
    const store = createAccountStore();
    const transactionStore = store.getTransactionStore('foo');

    expect(transactionStore).toBeDefined();
    expect(transactionStore.id).toEqual('foo');
  });

  it('should get worksheet store', () => {
    const store = createAccountStore();
    const worksheetStore = store.getWorksheetStore('foo');

    expect(worksheetStore).toBeDefined();
    expect(worksheetStore.worksheetId).toEqual('foo');
  });

  it('should create worksheet list store unfiltered', () => {
    const store = createAccountStore();
    const worksheetListStore = store.getWorksheetListStore();

    expect(worksheetListStore).toBeDefined();
    expect(worksheetListStore.filters).toEqual({});
  });

  it('should create worksheet list store filtered by userId', () => {
    const store = createAccountStore({ userId: 'usrId' });
    const worksheetListStore = store.getWorksheetListStore();

    expect(worksheetListStore).toBeDefined();
    expect(worksheetListStore.filters).toEqual({ createdby: 'usrId' });
  });

  it('should create permission list store when it creates account store', () => {
    const store = createAccountStore();

    expect(store.getPermissionListStore).toBeDefined();
  });

  it('should create id provider list store when it creates account store', () => {
    const store = createAccountStore();

    expect(store.getIdProviderListStore()).toBeDefined();
  });

  it('should create role list store', () => {
    const store = createAccountStore();

    expect(store.getRoleListStore()).toBeDefined();
  });

  it('should create client list store when it creates account store', () => {
    const store = createAccountStore();

    expect(store.getClientListStore()).toBeDefined();
  });

  it('should create database list store', () => {
    const store = createAccountStore();

    expect(store.getDatabaseListStore()).toBeDefined();
  });

  it('should create database list store', () => {
    const store = createAccountStore();

    expect(store.getDatabaseListStore()).toBeDefined();
  });

  it('should create Tree View store with engine', () => {
    const store = createAccountStore();

    store.getEditorStore().setVisibleEngine('dummy-engine');

    const treeViewStore = store.getTreeViewStore();

    expect(treeViewStore).toBeDefined();
    expect(treeViewStore.engine).toEqual(store.getEditorStore().visibleEngine);
  });

  it('should create user list store', () => {
    const store = createAccountStore();

    expect(store.getUserListStore()).toBeDefined();
  });

  it('should create account list store when it creates account store', () => {
    const store = createAccountStore();

    expect(store.getAccountListStore()).toBeDefined();
  });

  it('should create editor store', () => {
    const store = createAccountStore();

    expect(store.getEditorStore()).toBeDefined();
  });

  it('should update tab names', async () => {
    const store = createAccountStore();

    const editorStore = store.getEditorStore();

    editorStore.addTab({
      id: 'tab-foo-id',
      type: 'WORKSHEET',
      name: 'foo-id',
      worksheetId: 'foo-id',
    });

    jest.spyOn(editorStore, 'patchNames');

    const worksheetListStore = store.getWorksheetListStore();

    runInAction(() => {
      worksheetListStore['worksheets'] = {
        'foo-id': mockWorksheet({ name: 'foo-name' }),
      };
    });

    await waitFor(() => {
      expect(editorStore.patchNames).toHaveBeenCalledWith({
        'tab-foo-id': 'foo-name',
      });
    });
  });
});
