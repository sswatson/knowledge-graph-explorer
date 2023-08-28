import WorksheetListStore from './worksheetListStore';

export type WorksheetListStoreMock = Partial<
  Pick<WorksheetListStore, keyof WorksheetListStore>
>;

export function createWorksheetListStoreMock(
  mockValues: WorksheetListStoreMock = {},
) {
  const mockedWorksheet = mockValues;

  const mock: Pick<WorksheetListStore, keyof WorksheetListStore> = {
    accountId: '',
    isLoaded: false,
    isLoading: false,
    worksheetsStores: {},
    tempWorksheetsStores: {},
    errorCounts: {},
    problemCounts: {},
    filters: mockedWorksheet.filters ?? {},
    worksheetsList: [],
    request: jest.fn(),
    loadWorksheets: jest.fn(),
    createWorksheet: mockedWorksheet.createWorksheet ?? jest.fn(),
    deleteWorksheet: jest.fn(),
    renameWorksheet: jest.fn(),
    getWorksheetById: jest.fn(),
    filterWorksheets: jest.fn(),
    getWorksheetStore: jest.fn(),
    addNewWorksheet: jest.fn(),
    commitTempStores: jest.fn(),
    namesMap: {},
    ...mockValues,
  };

  return mock as WorksheetListStore;
}
