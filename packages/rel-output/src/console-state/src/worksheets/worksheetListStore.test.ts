import { createSyncStoreMock } from '../accounts/syncStoreMock';
import { createClientMock } from '../clientMock';
import { RequestProps } from '../utils/makeRequest';
import WorksheetListStore from './worksheetListStore';
import { getWorksheetPath } from './worksheetStore';
import { createWorksheetStoreMock } from './worksheetStoreMock';

const accountId = 'accId';
const url = getWorksheetPath(accountId);

const data = [
  {
    id: '5d4604bd-472d-3470-d251-eab6a53bce52',
    name: 'w1',
    createdBy: 'John',
    createdOn: 1661517131000,
  },
  {
    id: 'e6830a01-60fa-193e-1b18-3ae9bb9cbc81',
    name: 'w2',
    createdBy: 'Mike',
    createdOn: 1663178624000,
  },
  {
    id: '9dccc983-ebb6-34dc-5fdd-19db438952bd',
    name: 'w3',
    createdBy: 'Bob',
    createdOn: 1663184827000,
  },
];

function createWorksheetListStore({
  requestMock,
  userId,
}: {
  requestMock?: <T>(props: RequestProps) => Promise<{ data: T }>;
  userId?: string;
} = {}) {
  const request = requestMock ?? jest.fn().mockResolvedValue({ data });

  return {
    requestMock: request,
    store: new WorksheetListStore(
      createSyncStoreMock(),
      accountId,
      request,
      createClientMock(),
      userId,
    ),
  };
}

describe('Worksheet List Store', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should list worksheets', async () => {
    const abortController = new AbortController();
    const { store, requestMock } = createWorksheetListStore();

    expect(store.worksheetsList).toHaveLength(0);

    await store.loadWorksheets();

    expect(requestMock).toHaveBeenCalledWith({
      query: {},
      url,
      signal: abortController.signal,
    });
    expect(store.worksheetsList).toHaveLength(3);
    expect(store.filters).toEqual({});
    expect(store.isLoaded).toBeTruthy();
  });

  it('should filter by default worksheets', async () => {
    const { store } = createWorksheetListStore({ userId: 'uId' });

    expect(store.filters).toEqual({ createdby: 'uId' });
  });

  it('should filter worksheets', async () => {
    const abortController = new AbortController();
    const { store, requestMock } = createWorksheetListStore({
      requestMock: jest.fn().mockResolvedValue({
        data: [data[0]],
      }),
    });
    const loadWorksheetsMock = jest.spyOn(store, 'loadWorksheets');
    const filters = { createdby: 'John' };

    await store.filterWorksheets(filters);
    expect(store.filters).toEqual(filters);
    expect(loadWorksheetsMock).toHaveBeenCalled();
    expect(store.isLoaded).toBeTruthy();
    expect(requestMock).toHaveBeenCalledWith({
      query: filters,
      url,
      signal: abortController.signal,
    });
    expect(store.worksheetsList).toHaveLength(1);
  });

  it('should create worksheet', async () => {
    const { store, requestMock } = createWorksheetListStore({
      requestMock: jest.fn().mockResolvedValue({
        data: data[0],
      }),
    });

    await store.createWorksheet('w1');
    expect(requestMock).toHaveBeenCalledWith({
      data: { name: 'w1' },
      method: 'POST',
      url,
    });
    expect(store.worksheetsList).toHaveLength(1);
    expect(store.worksheetsList).toEqual([data[0]]);
  });

  it('should rename worksheet', async () => {
    const newId = 'newId';
    const { store, requestMock } = createWorksheetListStore({
      requestMock: jest.fn().mockResolvedValue({
        data: {
          ...data[0],
          name: newId,
        },
      }),
    });

    await store.renameWorksheet(data[0].id, newId);

    expect(requestMock).toHaveBeenCalledWith({
      data: { name: newId },
      method: 'PATCH',
      url: `${url}/${data[0].id}`,
    });
    expect(store.worksheetsList).toHaveLength(1);
    expect(store.worksheetsList[0].name).toEqual(newId);
  });

  it('should rename worksheet via store', async () => {
    const { store, requestMock } = createWorksheetListStore({
      requestMock: jest.fn().mockResolvedValue({}),
    });

    const worksheetStore = createWorksheetStoreMock();

    jest.spyOn(worksheetStore, 'setName');

    store.worksheetsStores['foo'] = worksheetStore;

    await store.renameWorksheet('foo', 'newName');

    expect(requestMock).not.toHaveBeenCalled();
    expect(worksheetStore.setName).toHaveBeenCalledWith('newName');
  });

  it('should delete worksheet', async () => {
    const { store, requestMock } = createWorksheetListStore();
    const mockOnCloseWorksheetTab = jest.fn();

    store['syncStore'] = createSyncStoreMock({
      closeWorksheetTab: mockOnCloseWorksheetTab,
    });
    store.worksheetsStores[data[0].id] = createWorksheetStoreMock();

    await store.loadWorksheets();
    await store.deleteWorksheet(data[0].id);

    expect(requestMock).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `${url}/${data[0].id}`,
    });
    expect(store.worksheetsList).toHaveLength(2);
    expect(store.worksheetsList).toEqual([data[1], data[2]]);
    expect(store.worksheetsStores[data[0].id]).toBeUndefined();
    expect(mockOnCloseWorksheetTab).toHaveBeenCalledWith(data[0].id);
  });

  it('should get worksheet by id', async () => {
    const { store } = createWorksheetListStore();

    await store.loadWorksheets();
    expect(store.getWorksheetById(data[0].id)).toEqual(data[0]);
    expect(store.getWorksheetById(data[2].id)).toEqual(data[2]);
  });

  it('should get worksheet store', () => {
    const { store } = createWorksheetListStore();

    const worksheetStore = store.getWorksheetStore('foo');

    expect(worksheetStore).toBeDefined();
    expect(worksheetStore.worksheetId).toEqual('foo');
    expect(store.worksheetsStores['foo']).toBeUndefined();
    expect(store.tempWorksheetsStores['foo']).toBeDefined();
  });

  it('should commit temp worksheet stores', () => {
    const { store } = createWorksheetListStore();

    store.worksheetsStores = {};
    store.tempWorksheetsStores = {
      foo: createWorksheetStoreMock(),
    };

    store.commitTempStores();

    expect(store.worksheetsStores['foo']).toBeDefined();
    expect(store.tempWorksheetsStores['foo']).toBeUndefined();
  });

  it('should add new worksheet', () => {
    const { store } = createWorksheetListStore();

    const worksheetStore = store.addNewWorksheet();

    expect(worksheetStore).toBeDefined();
    expect(worksheetStore.worksheetId).toBeDefined();
    expect(worksheetStore.name).toContain('Untitled');
  });

  it('should get names map', () => {
    const { store } = createWorksheetListStore();

    store['worksheets'] = {
      '1': {
        id: '1',
        name: 'w1',
        createdBy: 'John',
        createdOn: 1661517131000,
        updatedBy: 'John',
        updatedOn: 1661517131000,
        readOnly: false,
      },
      '2': {
        id: '2',
        name: 'w2',
        createdBy: 'Joe',
        createdOn: 1661517131000,
        updatedBy: 'Joe',
        updatedOn: 1661517131000,
        readOnly: false,
      },
    };
    store.worksheetsStores['3'] = createWorksheetStoreMock({ name: 'w3' });

    const namesMap = {
      '1': 'w1',
      '2': 'w2',
      '3': 'w3',
    };

    expect(store.namesMap).toStrictEqual(namesMap);
  });

  it('should get error counts', () => {
    const { store } = createWorksheetListStore();

    store.worksheetsStores = {
      foo: createWorksheetStoreMock({
        errorCount: 3,
      }),
      bar: createWorksheetStoreMock({
        errorCount: 1,
      }),
    };

    expect(store.errorCounts).toStrictEqual({
      foo: 3,
      bar: 1,
    });
  });

  it('should get problem counts', () => {
    const { store } = createWorksheetListStore();

    store.worksheetsStores = {
      foo: createWorksheetStoreMock({
        problemCount: 3,
      }),
      bar: createWorksheetStoreMock({
        problemCount: 1,
      }),
    };

    expect(store.problemCounts).toStrictEqual({
      foo: 3,
      bar: 1,
    });
  });

  it('should abort unfinished request and apply filters', async () => {
    const abortController = new AbortController();
    const abortError = new Error('abort error');
    const { store, requestMock } = createWorksheetListStore({
      requestMock: jest
        .fn()
        .mockRejectedValueOnce(abortError)
        .mockResolvedValue({
          data: [data[0]],
        }),
    });

    jest.spyOn(store, 'loadWorksheets');
    jest.spyOn(store, 'request');

    store.loadWorksheets();

    expect(store.isLoading).toBe(true);
    expect(store.error).toBeUndefined();
    expect(store.isLoaded).toBeFalsy();

    const filters = { createdby: 'John' };

    await store.filterWorksheets(filters);

    expect(store.filters).toEqual(filters);
    expect(store.loadWorksheets).toHaveBeenCalledTimes(2);
    expect(store.isLoaded).toBeTruthy();
    expect(requestMock).toHaveBeenNthCalledWith(1, {
      query: {},
      url,
      signal: abortController.signal,
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      query: filters,
      url,
      signal: abortController.signal,
    });
    expect(store.worksheetsList).toHaveLength(1);
  });
});
