import { createClientMock } from '../clientMock';
import WorksheetStore, { Worksheet } from './worksheetStore';

export type WorksheetStoreMock = Partial<
  Pick<WorksheetStore, keyof WorksheetStore>
>;

export function createWorksheetStoreMock(mockValues: WorksheetStoreMock = {}) {
  const mockedWorksheet = mockValues.uiState;

  const mock: Pick<WorksheetStore, keyof WorksheetStore> = {
    loadWorksheet: jest.fn(),
    runWorksheet: jest.fn(),
    saveWorksheet: jest.fn(),
    request: jest.fn(),
    cancelTransaction: jest.fn(),
    setName: jest.fn(),
    setDisplayMode: jest.fn(),
    setValue: jest.fn(),
    databaseName: '',
    setDatabaseName: jest.fn(),
    setReadOnly: jest.fn,
    setSelection: jest.fn(),
    engineName: '',
    setEngineName: jest.fn(),
    setSelectionStartFromLine: jest.fn(),
    analyzeWorksheetDefinitions: jest.fn(),
    readOnly: mockedWorksheet?.readOnly ?? false,
    isLoading: false,
    isLoaded: false,
    isSaving: false,
    isDirty: false,
    isCancelling: false,
    isRunning: false,
    isNotFound: false,
    canCancel: false,
    startedAt: undefined,
    finishedAt: undefined,
    loadError: undefined,
    updateError: undefined,
    selection: undefined,
    execError: undefined,
    transactionId: undefined,
    lastSaveTime: undefined,
    gutterHighlightRange: undefined,
    errorCount: 0,
    problemCount: 0,
    worksheetId: mockedWorksheet?.id ?? '',
    value: mockedWorksheet?.value ?? '',
    name: mockedWorksheet?.name ?? '',
    displayMode: '',
    client: createClientMock(),
    serverState: undefined,
    storedState: {
      engineName: '',
      databaseName: '',
    },
    diagnostics: [],
    editorDiagnostics: [],
    icViolations: [],
    output: [],
    definitions: [],
    isNew: false,
    setIsNew: jest.fn(),
    ...mockValues,
  };

  // casting it to WorksheetStore because of private fields
  return mock as WorksheetStore;
}

export function mockWorksheet(mockedValue: Partial<Worksheet> = {}): Worksheet {
  return {
    id: 'worksheetId',
    name: 'worksheetName',
    updatedBy: 'updatedBy',
    updatedOn: Date.now(),
    createdBy: 'createdBy',
    createdOn: Date.now(),
    value: 'worksheetValue',
    readOnly: false,
    ...mockedValue,
  };
}
