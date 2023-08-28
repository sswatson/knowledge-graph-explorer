import { sessionStorage } from '@shopify/jest-dom-mocks';
import { waitFor } from '@testing-library/react';
import { reaction } from 'mobx';

import { EngineSize } from '@relationalai/rai-sdk-javascript/web';

import { createClientMock } from '../clientMock';
import { EngineState, EngineStore, STORAGE_KEY } from './engineStore';
import { mockEngine } from './engineStoreMock';

describe('EngineStore', () => {
  const accountId = 'accId';

  afterEach(() => {
    sessionStorage.restore();
  });

  it('should not load engines when not observed', () => {
    const mockEngines = [mockEngine({ name: 'foo' })];
    const clientMock = createClientMock({
      listEngines: jest.fn().mockResolvedValue(mockEngines),
    });
    const store = new EngineStore(accountId, clientMock);

    expect(clientMock.listEngines).not.toHaveBeenCalled();

    store.loadEngines();

    expect(clientMock.listEngines).not.toHaveBeenCalled();
  });

  it('should load engines when observed', async () => {
    const mockEngines = [mockEngine({ name: 'foo' })];
    const clientMock = createClientMock({
      listEngines: jest.fn().mockResolvedValue(mockEngines),
    });
    const store = new EngineStore(accountId, clientMock);

    expect(store.engines).toEqual([]);
    expect(clientMock.listEngines).not.toHaveBeenCalled();
    expect(store.isLoading).toEqual(false);

    const cancel = reaction(
      () => store.engines,
      () => {},
    );

    store.loadEngines();

    expect(store.isLoading).toEqual(true);

    cancel();

    await waitFor(() => expect(clientMock.listEngines).toHaveBeenCalled());
    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.engines).toEqual(mockEngines);
  });

  it('should mix in pending engines', async () => {
    const mockEngines = [
      mockEngine({ name: 'foo', state: EngineState.PROVISIONED }),
      mockEngine({ name: 'bar' }),
    ];
    const clientMock = createClientMock({
      listEngines: jest.fn().mockResolvedValue(mockEngines),
    });
    const store = new EngineStore(accountId, clientMock);
    const pendingEngine = mockEngine({
      name: 'foo',
      state: EngineState.DELETING,
    });

    store['pendingEngines'] = [
      {
        pendingEngine,
        staleEngine: mockEngines[0],
      },
    ];

    const cancel = reaction(
      () => store.engines,
      () => {},
    );

    await store.loadEngines();

    cancel();

    expect(store.engines).toEqual([mockEngines[1], pendingEngine]);
  });

  it('should sort engines', async () => {
    const mockEngines = [
      mockEngine({ name: 'b-engine' }),
      mockEngine({ name: 'a-engine' }),
    ];
    const clientMock = createClientMock({
      listEngines: jest.fn().mockResolvedValue(mockEngines),
    });
    const store = new EngineStore(accountId, clientMock);

    const cancel = reaction(
      () => store.engines,
      () => {},
    );

    store.loadEngines();

    cancel();

    await waitFor(() => {
      expect(store.engines).toEqual([mockEngines[1], mockEngines[0]]);
    });
  });

  it('should handle error when loading engines', async () => {
    const error = new Error('error');
    const clientMock = createClientMock({
      listEngines: jest.fn().mockRejectedValue(error),
    });
    const store = new EngineStore(accountId, clientMock);

    expect(store.engines).toEqual([]);
    expect(store.error).toBeUndefined();
    expect(clientMock.listEngines).not.toHaveBeenCalled();
    expect(store.isLoading).toEqual(false);

    const cancel = reaction(
      () => store.engines,
      () => {},
    );

    store.loadEngines();

    expect(store.isLoading).toEqual(true);

    cancel();

    await waitFor(() => expect(clientMock.listEngines).toHaveBeenCalled());
    await waitFor(() => expect(store.isLoading).toEqual(false));
    expect(store.engines).toEqual([]);
    expect(store.error).toBe(error);
  });

  it('should poll engines when non deletable engine is present', async () => {
    const mockEngines = [
      mockEngine({ name: 'foo' }),
      mockEngine({ name: 'bar', state: EngineState.PROVISIONING }),
    ];
    let listEnginesMock = jest.fn().mockResolvedValue(mockEngines);
    const clientMock = createClientMock({
      listEngines: listEnginesMock,
    });
    const store = new EngineStore(accountId, clientMock, 10);

    store.engines = mockEngines;

    expect(store.engines).toEqual(mockEngines);

    reaction(
      () => store.engines,
      () => {},
    );

    await waitFor(() => {
      expect(listEnginesMock.mock.calls.length > 5).toBeTruthy();
    });

    listEnginesMock = jest.fn().mockResolvedValue([mockEngines[0]]);
    clientMock.listEngines = listEnginesMock;

    await waitFor(() => {
      expect(store.engines.length).toEqual(1);
    });
  });

  it('should set selected engine', async () => {
    const store = new EngineStore(accountId, createClientMock());

    expect(store.selectedEngine).toEqual('');

    store.setSelectedEngine('foo');

    expect(store.selectedEngine).toEqual('foo');
  });

  it('should save selected engine in session storage', async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selectedEngines: { acc1: 'baz' } }),
    );

    const store = new EngineStore(accountId, createClientMock());

    store.setSelectedEngine('foo');

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({ selectedEngines: { acc1: 'baz', accId: 'foo' } }),
    );

    sessionStorage.removeItem('engineStore');

    store.setSelectedEngine('bar');

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({ selectedEngines: { accId: 'bar' } }),
    );
  });

  it('should read selected engine from session storage', async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selectedEngines: { acc1: 'baz', accId: 'foo' } }),
    );

    const store = new EngineStore(accountId, createClientMock());

    expect(store.selectedEngine).toEqual('foo');
  });

  it('should get provisioned engines', async () => {
    const mockEngines = [
      mockEngine({ name: 'foo' }),
      mockEngine({ name: 'bar', state: EngineState.REQUESTED }),
    ];
    const store = new EngineStore(accountId, createClientMock());

    store.engines = mockEngines;

    expect(store.provisionedEngines).toEqual([mockEngines[0]]);
  });

  it('should delete engine', async () => {
    const mockEngines = [
      mockEngine({ name: 'bar' }),
      mockEngine({ name: 'foo' }),
    ];
    const clientMock = createClientMock({
      deleteEngine: jest.fn().mockResolvedValue({}),
    });
    const store = new EngineStore(accountId, clientMock, 1);

    const mockOnSetEngines = jest.fn();

    store['setEngines'] = mockOnSetEngines;
    store.engines = mockEngines;

    await store.deleteEngine('bar');

    expect(store['pendingEngines']).toEqual([
      {
        pendingEngine: {
          ...mockEngines[0],
          state: EngineState.DEPROVISIONING,
        },
        staleEngine: mockEngines[0],
      },
    ]);
    expect(clientMock.deleteEngine).toHaveBeenCalledWith('bar');
    expect(mockOnSetEngines).toHaveBeenCalled();
  });

  it('should handle failed delete engine', async () => {
    const mockEngines = [
      mockEngine({ name: 'bar' }),
      mockEngine({ name: 'foo' }),
    ];
    const clientMock = createClientMock({
      deleteEngine: jest.fn().mockRejectedValue(new Error('err')),
    });
    const store = new EngineStore(accountId, clientMock, 1);

    store.engines = mockEngines;

    try {
      await store.deleteEngine('bar');
      // eslint-disable-next-line no-empty
    } catch {}

    expect(store['pendingEngines']).toEqual([]);
  });

  it('should create engine', async () => {
    const clientMock = createClientMock({
      createEngine: jest
        .fn()
        .mockResolvedValue(
          mockEngine({ name: 'baz', state: EngineState.REQUESTED }),
        ),
    });
    const store = new EngineStore(accountId, clientMock, 1);

    jest.spyOn(store, 'loadEngines');

    await store.createEngine('baz', EngineSize.XL);

    expect(store.engines[0].name).toEqual('baz');
    expect(store.engines[0].state).toEqual(EngineState.REQUESTED);

    await waitFor(() =>
      expect(clientMock.createEngine).toHaveBeenCalledWith(
        'baz',
        EngineSize.XL,
      ),
    );
    await waitFor(() =>
      // should start polling engines
      expect(store.loadEngines).toHaveBeenCalled(),
    );
  });

  it('should get engine by name', () => {
    const mockEngines = [
      mockEngine({ name: 'foo' }),
      mockEngine({ name: 'bar', state: EngineState.PROVISIONING }),
    ];
    const store = new EngineStore(accountId, createClientMock(), 10);

    store.engines = mockEngines;

    expect(store.getEngine('bar')).toStrictEqual(mockEngines[1]);
  });

  it('should resume engine', async () => {
    const mockEngines = [
      mockEngine({ name: 'bar' }),
      mockEngine({ name: 'foo' }),
    ];
    const clientMock = createClientMock({
      resumeEngine: jest.fn().mockResolvedValue({}),
    });
    const store = new EngineStore(accountId, clientMock, 1);

    const mockOnSetEngines = jest.fn();

    store['setEngines'] = mockOnSetEngines;
    store.engines = mockEngines;

    await store.resumeEngine('bar');

    expect(store['pendingEngines']).toEqual([
      {
        pendingEngine: {
          ...mockEngines[0],
          state: EngineState.REQUESTED,
        },
        staleEngine: mockEngines[0],
      },
    ]);
    expect(clientMock.resumeEngine).toHaveBeenCalledWith('bar');
    expect(mockOnSetEngines).toHaveBeenCalled();
  });

  it('should handle failed resume engine', async () => {
    const mockEngines = [
      mockEngine({ name: 'bar' }),
      mockEngine({ name: 'foo' }),
    ];
    const clientMock = createClientMock({
      resumeEngine: jest.fn().mockRejectedValue(new Error('err')),
    });
    const store = new EngineStore(accountId, clientMock, 1);

    store.engines = mockEngines;

    try {
      await store.resumeEngine('bar');
      // eslint-disable-next-line no-empty
    } catch {}

    expect(store['pendingEngines']).toEqual([]);
  });

  it('should suspend engine', async () => {
    const mockEngines = [
      mockEngine({ name: 'bar' }),
      mockEngine({ name: 'foo' }),
    ];
    const clientMock = createClientMock({
      suspendEngine: jest.fn().mockResolvedValue({}),
    });
    const store = new EngineStore(accountId, clientMock, 1);

    const mockOnSetEngines = jest.fn();

    store['setEngines'] = mockOnSetEngines;
    store.engines = mockEngines;

    await store.suspendEngine('bar');

    expect(store['pendingEngines']).toEqual([
      {
        pendingEngine: {
          ...mockEngines[0],
          state: EngineState.SUSPENDED,
        },
        staleEngine: mockEngines[0],
      },
    ]);
    expect(clientMock.suspendEngine).toHaveBeenCalledWith('bar');
    expect(mockOnSetEngines).toHaveBeenCalled();
  });

  it('should handle failed suspend engine', async () => {
    const mockEngines = [
      mockEngine({ name: 'bar' }),
      mockEngine({ name: 'foo' }),
    ];
    const clientMock = createClientMock({
      suspendEngine: jest.fn().mockRejectedValue(new Error('err')),
    });
    const store = new EngineStore(accountId, clientMock, 1);

    store.engines = mockEngines;

    try {
      await store.suspendEngine('bar');
      // eslint-disable-next-line no-empty
    } catch {}

    expect(store['pendingEngines']).toEqual([]);
  });
});
