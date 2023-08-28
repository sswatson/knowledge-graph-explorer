import { createClientMock } from './clientMock';
import { RootStore } from './rootStore';
import { StoreContext } from './types';

function createContext(contextValues: Partial<StoreContext> = {}) {
  return {
    accountId: 'accId',
    getToken: () => Promise.resolve('token'),
    flags: {},
    userId: '',
    client: createClientMock(),
    ...contextValues,
  };
}

describe('RootStore', () => {
  it('should get account store', () => {
    const store = new RootStore();

    const fooClient = createClientMock();

    store.setContext(
      createContext({
        client: fooClient,
        accountId: 'foo',
      }),
    );

    expect(store.getAccountStore('foo').accountId).toEqual('foo');
  });

  it('should get transaction store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'accId',
      }),
    );

    const transactionStore = store.getTransactionStore('accId', 'foo');

    expect(transactionStore).toBeDefined();
    expect(transactionStore.id).toEqual('foo');
  });

  it('should throw error when getting unknown account', () => {
    const store = new RootStore();

    expect(() => {
      store.getAccountStore('bar');
    }).toThrow();
  });

  it('should get engine store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getEngineStore('foo')).toBeDefined();
  });

  it('should get transaction list store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getTransactionListStore('foo')).toBeDefined();
  });

  it('should get permission list store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getPermissionListStore('foo')).toBeDefined();
  });

  it('should get id provider list store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getIdProviderListStore('foo')).toBeDefined();
  });

  it('should get role list store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getRoleListStore('foo')).toBeDefined();
  });

  it('should get client list store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getClientListStore('foo')).toBeDefined();
  });

  it('should get user list store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getUserListStore('foo')).toBeDefined();
  });

  it('should get account list store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getAccountListStore('foo')).toBeDefined();
  });

  it('should get notification list store', () => {
    const store = new RootStore();

    expect(store.getNotificationListStore).toBeDefined();
  });

  it('should get editor store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getEditorStore('foo')).toBeDefined();
  });

  it('should get tree view store', () => {
    const store = new RootStore();

    store.setContext(
      createContext({
        accountId: 'foo',
      }),
    );

    expect(store.getTreeViewStore('foo')).toBeDefined();
  });
});
