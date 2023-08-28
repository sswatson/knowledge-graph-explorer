export type FileSystemFileMock = {
  kind: 'file';
  name: string;
  value: string;
};

export type FileSystemDirectoryMock = {
  kind: 'directory';
  name: string;
  items: FileSystemMock[];
};

export type FileSystemMock = FileSystemFileMock | FileSystemDirectoryMock;

let globalDataTransferItem: any;
let globalFileSystemDirectoryHandle: any;
let globalFileSystemFileHandle: any;
let globalFileSystemDirectoryEntry: any;
let globalFileSystemFileEntry: any;

type MockType = 'handle' | 'entry';

export function mockFileSystemGlobals(type: MockType) {
  globalDataTransferItem = global.DataTransferItem;
  globalFileSystemDirectoryHandle = global.FileSystemDirectoryHandle;
  globalFileSystemFileHandle = global.FileSystemFileHandle;
  globalFileSystemDirectoryEntry = global.FileSystemDirectoryEntry;
  globalFileSystemFileEntry = global.FileSystemFileEntry;

  switch (type) {
    case 'handle':
      global.DataTransferItem = DataTransferItemForHandle as any;
      break;
    case 'entry':
      global.DataTransferItem = DataTransferItemForEntry as any;
      break;
  }

  global.FileSystemDirectoryHandle = FileSystemDirectoryHandle as any;
  global.FileSystemFileHandle = FileSystemFileHandle as any;
  global.FileSystemDirectoryEntry = FileSystemDirectoryEntry as any;
  global.FileSystemFileEntry = FileSystemFileEntry as any;
}

export function restoreFileSystemGlobals() {
  global.DataTransferItem = globalDataTransferItem;
  global.FileSystemDirectoryHandle = globalFileSystemDirectoryHandle;
  global.FileSystemFileHandle = globalFileSystemFileHandle;
  global.FileSystemDirectoryEntry = globalFileSystemDirectoryEntry;
  global.FileSystemFileEntry = globalFileSystemFileEntry;
}

export function mockDataTransfer(mocks: FileSystemMock[]) {
  // TODO is type casting alright?
  return new DataTransfer(mocks) as any;
}

type DataTransferItem = DataTransferItemForEntry | DataTransferItemForHandle;

type DataTransferItemList = DataTransferItem[];

class DataTransfer {
  items: DataTransferItemList;

  constructor(private mocks: FileSystemMock[]) {
    this.items = mocks.map(x => {
      const supportsFileSystemAccessAPI =
        'getAsFileSystemHandle' in DataTransferItem.prototype;

      if (supportsFileSystemAccessAPI) {
        return new DataTransferItemForHandle(x);
      } else {
        return new DataTransferItemForEntry(x);
      }
    });
  }
}

class DataTransferItemForHandle {
  constructor(private mock: FileSystemMock) {}

  get kind() {
    // it is kind file for file and directory as well
    return 'file';
  }

  getAsFileSystemHandle() {
    if (this.mock.kind === 'directory') {
      return new FileSystemDirectoryHandle(this.mock);
    }

    return new FileSystemFileHandle(this.mock);
  }
}

class DataTransferItemForEntry {
  constructor(private mock: FileSystemMock) {}

  get kind() {
    // it is kind file for file and directory as well
    return 'file';
  }

  webkitGetAsEntry() {
    if (this.mock.kind === 'directory') {
      return new FileSystemDirectoryEntry(this.mock);
    }

    return new FileSystemFileEntry(this.mock);
  }
}

class FileSystemFileHandle {
  constructor(private mock: FileSystemFileMock) {}

  get kind() {
    return this.mock.kind;
  }

  get name() {
    return this.mock.name;
  }

  async getFile() {
    return new File([this.mock.value], this.mock.name);
  }
}

class FileSystemDirectoryHandle {
  constructor(private mock: FileSystemDirectoryMock) {}

  get kind() {
    return this.mock.kind;
  }

  get name() {
    return this.mock.name;
  }

  values(): (FileSystemFileHandle | FileSystemDirectoryHandle)[] {
    return this.mock.items.map(item => {
      if (item.kind === 'directory') {
        return new FileSystemDirectoryHandle(item);
      }

      return new FileSystemFileHandle(item);
    });
  }
}

class FileSystemDirectoryEntry {
  constructor(private mock: FileSystemDirectoryMock) {}

  isDirectory = true;
  isFile = false;

  get name() {
    return this.mock.name;
  }

  createReader() {
    return {
      readEntries: (
        cb: (
          entries: (FileSystemFileEntry | FileSystemDirectoryEntry)[],
        ) => void,
      ) => {
        cb(
          this.mock.items.map(item => {
            if (item.kind === 'directory') {
              return new FileSystemDirectoryEntry(item);
            }

            return new FileSystemFileEntry(item);
          }),
        );
      },
    };
  }
}

class FileSystemFileEntry {
  constructor(private mock: FileSystemFileMock) {}

  isFile = true;
  isDirectory = false;

  get name() {
    return this.mock.name;
  }

  file(cb: (f: File) => void) {
    cb(new File([this.mock.value], this.mock.name));
  }
}
