export function bytesToSize(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  if (bytes === 0) {
    return '0B';
  }

  const index = Number.parseInt(
    Math.floor(Math.log(bytes) / Math.log(1024)).toString(),
    10,
  );

  if (index === 0) {
    return `${bytes}${sizes[index]}`;
  }

  return `${(bytes / 1024 ** index).toFixed(1)}${sizes[index]}`;
}

export function basename(path: string) {
  return path.replace(/.*\/|\.[^.]*$/g, '');
}

export function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/\s/gi, '_') // spaces with _
    .replace(/[^\w-]/gi, ''); // everything else with ''
}

export type TextFile = {
  name: string;
  size: number;
  content: string;
  relativePath?: string;
};

export async function readFile(file: File) {
  return new Promise<TextFile>((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onloadend = () => {
      resolve({
        name: file.name,
        relativePath: file.webkitRelativePath,
        size: file.size,
        content: fileReader.result as string,
      });
    };

    // eslint-disable-next-line unicorn/prefer-add-event-listener
    fileReader.onabort = () => {
      reject(new Error(`Abort occurred during reading file: ${file.name}`));
    };

    // eslint-disable-next-line unicorn/prefer-add-event-listener
    fileReader.onerror = () => {
      reject(new Error(`Error occurred during reading file: ${file.name}`));
    };

    if (file.type.startsWith('image/') && !file.type.startsWith('image/svg')) {
      fileReader.readAsDataURL(file);
    } else {
      fileReader.readAsText(file);
    }
  });
}

export function testFileInputDirectory() {
  const input = document.createElement('input');

  return input['webkitdirectory'] !== undefined;
}

export async function readFilesFromDataTransfer(
  dataTransfer: DataTransfer,
): Promise<File[]> {
  // Run feature detection.
  const supportsFileSystemAccessAPI =
    'getAsFileSystemHandle' in DataTransferItem.prototype;

  if (supportsFileSystemAccessAPI) {
    return await getFilesFromHandle(dataTransfer.items);
  } else {
    // if getAsFileSystemHandle is not supported, use webkitGetAsEntry
    return await getFilesFromEntry(dataTransfer.items);
  }
}

async function getFilesFromHandle(
  dataTransferItems: DataTransferItemList,
): Promise<File[]> {
  const promiseHandles = Array.from(dataTransferItems)
    //include only files (where file misleadingly means actual file _or_ directory)
    .filter(item => item.kind === 'file')
    .map(item =>
      //  using a modern `FileSystemHandle
      item.getAsFileSystemHandle(),
    );

  const files: File[] = [];

  for await (const handle of promiseHandles) {
    if (!handle) {
      break;
    }

    if (isHandleDirectory(handle)) {
      const dirFiles = await readDirectoryHandle(handle, handle.name);

      files.push(...dirFiles);
    } else if (isHandleFile(handle)) {
      const file = await readFileHandle(handle);

      files.push(file);
    }
  }

  return files;
}

async function getFilesFromEntry(
  dataTransferItems: DataTransferItemList,
): Promise<File[]> {
  const entries = Array.from(dataTransferItems)
    //include only files (where file misleadingly means actual file _or_ directory)
    .filter(item => item.kind === 'file')
    //using a classic `FileSystemFileEntry`.
    .map(item => item.webkitGetAsEntry());

  const files: File[] = [];

  for (const entry of entries) {
    if (!entry) {
      break;
    }

    if (isEntryDirectory(entry)) {
      const dirFiles = await readDirectoryEntry(entry);

      files.push(...dirFiles);
    } else if (isEntryFile(entry)) {
      const file = await readFileEntry(entry);

      files.push(file);
    }
  }

  return files;
}

async function readDirectoryEntry(
  entry: FileSystemDirectoryEntry,
): Promise<File[]> {
  const promises: File[] = [];

  await readEntry(entry);

  async function readEntry(entry: FileSystemEntry, path?: string) {
    if (isEntryFile(entry)) {
      const file = await readFileEntry(entry, path);

      promises.push(file);
    } else if (isEntryDirectory(entry)) {
      const nestedPath = path ? `${path}/${entry.name}` : entry.name;

      await readReaderContent(entry.createReader(), nestedPath);
    }
  }

  async function readReaderContent(
    reader: FileSystemDirectoryReader,
    path?: string,
  ) {
    await new Promise<void>((resolve, reject) =>
      reader.readEntries(async entries => {
        try {
          await Promise.all(entries.map(entry => readEntry(entry, path)));

          resolve();
        } catch (error) {
          reject(error);
        }
      }),
    );
  }

  return await Promise.all(promises);
}

async function readFileEntry(entry: FileSystemFileEntry, path?: string) {
  const pureFile = await new Promise<File>((resolve, reject) => {
    entry.file(resolve, reject);
  });

  const file = Object.defineProperty(pureFile, 'webkitRelativePath', {
    configurable: true,
    enumerable: true,
    get: () => (path ? `${path}/${pureFile.name}` : `${pureFile.name}`),
  });

  return file;
}

async function readDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  relativePath?: string,
): Promise<File[]> {
  const files: File[] = [];

  const promiseHandleValues = dirHandle.values();

  for await (const handle of promiseHandleValues) {
    if (handle.kind === 'file') {
      const file = await readFileHandle(handle, relativePath);

      files.push(file);
    } else {
      const nestedPath = `${relativePath}/${handle.name}`;

      const nestedFiles = await readDirectoryHandle(handle, nestedPath);

      files.push(...nestedFiles);
    }
  }

  return files;
}

async function readFileHandle(
  handle: FileSystemFileHandle,
  path?: string,
): Promise<File> {
  const pureFile = await handle.getFile();

  const file = Object.defineProperty(pureFile, 'webkitRelativePath', {
    configurable: true,
    enumerable: true,
    get: () => (path ? `${path}/${pureFile.name}` : `${pureFile.name}`),
  });

  return file;
}

function isEntryDirectory(
  entry: FileSystemEntry,
): entry is FileSystemDirectoryEntry {
  return entry.isDirectory;
}

function isEntryFile(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile;
}

function isHandleDirectory(
  handle: FileSystemHandle,
): handle is FileSystemDirectoryHandle {
  return handle.kind === 'directory';
}

function isHandleFile(
  handle: FileSystemHandle,
): handle is FileSystemFileHandle {
  return handle.kind === 'file';
}
