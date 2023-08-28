import { DisplayMode } from '@relationalai/output-arrow';
import {
  TransactionAsyncResult,
  TransactionAsyncState,
} from '@relationalai/rai-sdk-javascript/web';
import { plainToArrow } from '@relationalai/utils';

import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import { BaseRelationStore, STORAGE_KEY } from './baseRelationStore';

const databaseId = 'bdId';
const accountId = 'accountId';
const baseRelationName = 'baseRelationName';
const transactionId = 'transactionId';
const txnResultMock: TransactionAsyncResult = {
  transaction: {
    id: transactionId,
    state: TransactionAsyncState.COMPLETED,
  },
  results: plainToArrow([
    {
      relationId: '/:rel/:catalog/:diagnostic/:message/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['message 1', 'message 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:severity/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['error', 'error'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:code/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['PARSE_ERROR', 'UNBOUND_VARIABLE'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:report/Int64/String',
      columns: [
        [BigInt(1), BigInt(2)],
        ['report 1', 'report 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:diagnostic/:model/Int64/String',
      columns: [[BigInt(2)], ['foo']],
    },
    {
      relationId: '/:output/:test/String/String',
      columns: [['a'], ['b']],
    },
    {
      relationId: `/:output/:__base_relation_${baseRelationName}__/:test2/String/String`,
      columns: [['a'], ['b']],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#constaint#0',
      columns: [[[BigInt(123), BigInt(0)]]],
    },
    {
      relationId:
        '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#foo#0',
      columns: [[[BigInt(456), BigInt(0)]]],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:report/HashValue/String',
      columns: [
        [
          [BigInt(123), BigInt(0)],
          [BigInt(456), BigInt(0)],
        ],
        ['report 1', 'report 2'],
      ],
    },
    {
      relationId: '/:rel/:catalog/:ic_violation/:model/HashValue/String',
      columns: [[[BigInt(456), BigInt(0)]], ['foo']],
    },
  ]),
};

const createBaseRelationStore = (
  clientMock = createClientMock(),
  syncStoreMock = createSyncStoreMock(),
) => {
  return new BaseRelationStore(
    syncStoreMock,
    accountId,
    databaseId,
    baseRelationName,
    clientMock,
  );
};

describe('BaseRelation Store', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.restore();
    sessionStorage.restore();
  });

  it('should load base relation via fast path', async () => {
    const clientMock = createClientMock({
      execAsync: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationStore(clientMock);

    store.setEngine('foo');

    const loadPromise = store.load();
    const startedDate = Date.now();

    expect(store.startedAt).toStrictEqual(startedDate);
    expect(store.isRunning).toBe(true);
    expect(store.execError).toBeUndefined();
    expect(store.errorCount).toStrictEqual(0);
    expect(store.finishedAt).toBeUndefined();
    expect(store.transactionId).toBeUndefined();
    expect(store.mode).toBe(DisplayMode.LOGICAL);

    await loadPromise;

    const finishedDate = Date.now();

    expect(store.isRunning).toBe(false);
    expect(store.finishedAt).toStrictEqual(finishedDate);
    expect(store.response).toStrictEqual(txnResultMock);
    expect(store.transactionId).toStrictEqual(txnResultMock.transaction.id);
  });

  it('should load base relation via slow path', async () => {
    const clientMock = createClientMock({
      execAsync: jest.fn().mockResolvedValue({
        transaction: txnResultMock.transaction,
      }),
    });
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationStore(clientMock, syncStoreMock);

    store.setEngine('foo');

    const loadPromise = store.load();
    const startedDate = Date.now();

    expect(store.startedAt).toStrictEqual(startedDate);
    expect(store.isRunning).toBe(true);
    expect(store.execError).toBeUndefined();
    expect(store.errorCount).toStrictEqual(0);
    expect(store.finishedAt).toBeUndefined();
    expect(store.transactionId).toBeUndefined();
    expect(store.mode).toBe(DisplayMode.LOGICAL);

    await loadPromise;

    const finishedDate = Date.now();

    expect(store.isRunning).toBe(false);
    expect(store.finishedAt).toStrictEqual(finishedDate);
    expect(store.response).toStrictEqual(txnResultMock);
    expect(store.transactionId).toStrictEqual(txnResultMock.transaction.id);
  });

  it('should not load base relation when engine not selected', async () => {
    const clientMock = createClientMock({
      exec: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationStore(clientMock);

    await store.load();

    expect(clientMock.exec).not.toHaveBeenCalled();
  });

  it('should not load base relation when isRunning true', async () => {
    const clientMock = createClientMock({
      exec: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationStore(clientMock);

    store.isRunning = true;

    await store.load();

    expect(clientMock.exec).not.toHaveBeenCalled();
  });

  it('should not load base relation when response exists', async () => {
    const clientMock = createClientMock({
      exec: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationStore(clientMock);

    store.response = txnResultMock;

    await store.load();

    expect(clientMock.exec).not.toHaveBeenCalled();
  });

  it('should handle load base relation error fast path', async () => {
    const error = new Error('load error');

    const clientMock = createClientMock({
      execAsync: jest.fn().mockRejectedValue(error),
    });

    const store = createBaseRelationStore(clientMock);

    store.setEngine('foo');
    await store.load();
    const finishedDate = Date.now();

    expect(store.transactionId).toBeUndefined();
    expect(store.isRunning).toBe(false);
    expect(store.execError).toStrictEqual(error);
    expect(store.errorCount).toStrictEqual(1);
    expect(store.finishedAt).toStrictEqual(finishedDate);
  });

  it('should handle load base relation error slow path', async () => {
    const error = new Error('load error');

    const clientMock = createClientMock({
      execAsync: jest.fn().mockResolvedValue({
        transaction: txnResultMock.transaction,
      }),
    });
    const syncStoreMock = createSyncStoreMock({
      pollTransaction: jest.fn().mockRejectedValue(error),
    });

    const store = createBaseRelationStore(clientMock, syncStoreMock);

    store.setEngine('foo');
    await store.load();
    const finishedDate = Date.now();

    expect(store.transactionId).toEqual(transactionId);
    expect(store.isRunning).toBe(false);
    expect(store.execError).toStrictEqual(error);
    expect(store.errorCount).toStrictEqual(1);
    expect(store.finishedAt).toStrictEqual(finishedDate);
  });

  it('should force load base relation even if response exists', async () => {
    const clientMock = createClientMock({
      execAsync: jest.fn(),
    });
    const store = createBaseRelationStore(clientMock);

    store.setEngine('foo');

    store.response = txnResultMock;

    jest.spyOn(clientMock, 'exec');

    await store.load(true);

    expect(clientMock.execAsync).toHaveBeenCalled();
  });

  it('should get output', () => {
    const store = createBaseRelationStore();

    store.response = txnResultMock;

    expect(store.output.length).toEqual(1);
    expect(store.output[0].relationId).toEqual('/:test2/String/String');
  });

  it('should set mode', () => {
    const store = createBaseRelationStore();

    expect(store.mode).toBe(DisplayMode.LOGICAL);
    store.setMode(DisplayMode.PHYSICAL);
    expect(store.mode).toBe(DisplayMode.PHYSICAL);
  });
  it('should set engine name', () => {
    const store = createBaseRelationStore();

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(store.engine).toEqual('');

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        test: 'something',
      }),
    );

    expect(store.engine).toEqual('');

    store.setEngine('foo');

    expect(store.engine).toEqual('foo');
    expect(store.storedState.engine).toEqual('foo');
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).toHaveBeenNthCalledWith(
      2,
      STORAGE_KEY,
      JSON.stringify({
        test: 'something',
        'accountId-bdId-baseRelationName': {
          engine: 'foo',
        },
      }),
    );
  });

  it('should read stored state from session storage', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-baseRelationName': {
          engine: 'foo',
        },
      }),
    );
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-baseRelationName': {
          engine: 'testEngine',
        },
      }),
    );

    const store = createBaseRelationStore();

    expect(store.engine).toEqual('foo');
  });

  it('should read stored state from local storage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-baseRelationName': {
          engine: 'testEngine',
        },
      }),
    );

    const store = createBaseRelationStore();

    expect(store.engine).toEqual('testEngine');
  });

  it('should save stored state on load', async () => {
    const clientMock = createClientMock({
      exec: jest.fn().mockResolvedValue(txnResultMock),
    });
    const store = createBaseRelationStore(clientMock);

    store.storedState = { engine: 'testEngine' };

    await store.load();

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({
        'accountId-bdId-baseRelationName': {
          engine: 'testEngine',
        },
      }),
    );
  });
});
