import { createClientMock } from '../clientMock';
import { ModelStore } from './modelStore';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type ModelStoreMock = Pick<ModelStore, keyof ModelStore>;

export function createModelStoreMock(mockValues: Partial<ModelStoreMock> = {}) {
  const mock: ModelStoreMock = {
    inflightTransactionId: '',
    transactionId: '',
    errorCount: 0,
    client: createClientMock(),
    diagnostics: [],
    editorDiagnostics: [],
    icViolations: [],
    databaseId: '',
    name: '',
    model: { name: '', value: '' },
    isLocal: false,
    isLoading: false,
    isLoaded: false,
    isSaving: false,
    isCancelling: false,
    isDirty: false,
    canCancel: false,
    storedState: {
      engineName: '',
    },
    filename: '',
    value: '',
    definitions: [],
    loadModel: jest.fn(),
    installModel: jest.fn(),
    cancelInstallModel: jest.fn(),
    exportModel: jest.fn(),
    setValue: jest.fn(),
    setSelection: jest.fn(),
    setResponse: jest.fn(),
    setName: jest.fn(),
    analyzeModelCompletions: jest.fn(),
    engineName: '',
    setEngineName: jest.fn(),
    error: undefined,
    ...mockValues,
  };

  // casting it to ModelStore because of private fields
  return mock as ModelStore;
}
