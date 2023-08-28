import {
  mockDataTransfer,
  mockFileSystemGlobals,
  restoreFileSystemGlobals,
} from './fileSystemMocks';
import {
  basename,
  bytesToSize,
  readFile,
  readFilesFromDataTransfer,
  sanitizeFileName,
} from './fileUtils';

describe('fileUtils', () => {
  it('should convert bytes', () => {
    expect(bytesToSize(123)).toEqual('123B');
    expect(bytesToSize(1234)).toEqual('1.2KB');
    expect(bytesToSize(1234567)).toEqual('1.2MB');
    expect(bytesToSize(12345678910)).toEqual('11.5GB');
    expect(bytesToSize(1234567891011)).toEqual('1.1TB');
  });

  it('should get basename', () => {
    expect(basename('foo.json')).toEqual('foo');
    expect(basename('foo.json.txt')).toEqual('foo.json');
    expect(basename('/blah/bar.txt')).toEqual('bar');
  });

  it('should sanitize filename', () => {
    expect(sanitizeFileName('foo.json')).toEqual('foojson');
    expect(sanitizeFileName(' !@#$%^&*()foo-json._txt  +*')).toEqual(
      'foo-json_txt__',
    );
  });

  it('should read file as text', async () => {
    const textDocument = 'this is a test file';
    const file = new File([textDocument], 'test.txt', {
      type: 'application/json',
    });

    const result = await readFile(file);

    expect(result).toEqual({
      name: 'test.txt',
      content: textDocument,
      size: 19,
    });
  });

  it('should not read svg as dataurl', async () => {
    const svgDocument = '<svg></svg>';
    const file = new File([svgDocument], 'test.svg', {
      type: 'image/svg+xml',
    });

    const result = await readFile(file);

    expect(result).toEqual({
      name: 'test.svg',
      content: svgDocument,
      size: 11,
    });
  });

  it('should read file as data url', async () => {
    const imageDocument = 'foo';
    const file = new File([imageDocument], 'test.png', {
      type: 'image/png',
    });

    const result = await readFile(file);

    expect(result).toEqual({
      name: 'test.png',
      content: 'data:image/png;base64,Zm9v',
      size: 3,
    });
  });

  it('should return array of files by using getAsFileSystemHandle', async () => {
    mockFileSystemGlobals('handle');

    const dataTransfer = mockDataTransfer([
      {
        kind: 'file',
        name: 'foo.txt',
        value: 'foo',
      },
      {
        kind: 'file',
        name: 'bar.txt',
        value: 'bar',
      },
    ]);

    const result = await readFilesFromDataTransfer(dataTransfer);

    expect(result?.map(f => f.webkitRelativePath)).toEqual([
      'foo.txt',
      'bar.txt',
    ]);
    expect(result?.map(f => f.name)).toEqual(['foo.txt', 'bar.txt']);

    restoreFileSystemGlobals();
  });

  it('should return array of files from nested folders by using getAsFileSystemHandle', async () => {
    mockFileSystemGlobals('handle');

    const dataTransfer = mockDataTransfer([
      {
        kind: 'directory',
        name: 'outer',
        items: [
          {
            kind: 'file',
            name: 'foo.txt',
            value: 'foo',
          },
          {
            kind: 'directory',
            name: 'inner',
            items: [
              {
                kind: 'file',
                name: 'file1.txt',
                value: 'file1',
              },
              {
                kind: 'file',
                name: 'file2.txt',
                value: 'file2',
              },
            ],
          },
        ],
      },
      {
        kind: 'file',
        name: 'bar.txt',
        value: 'bar',
      },
    ]);

    const result = await readFilesFromDataTransfer(dataTransfer);

    expect(result?.map(f => f.webkitRelativePath)).toEqual([
      'outer/foo.txt',
      'outer/inner/file1.txt',
      'outer/inner/file2.txt',
      'bar.txt',
    ]);
    expect(result?.map(f => f.name)).toEqual([
      'foo.txt',
      'file1.txt',
      'file2.txt',
      'bar.txt',
    ]);

    restoreFileSystemGlobals();
  });

  it('should return array of files by using webkitGetAsEntry', async () => {
    mockFileSystemGlobals('entry');

    const dataTransfer = mockDataTransfer([
      {
        kind: 'file',
        name: 'foo.txt',
        value: 'foo',
      },
      {
        kind: 'file',
        name: 'bar.txt',
        value: 'bar',
      },
    ]);

    const result = await readFilesFromDataTransfer(dataTransfer);

    expect(result?.map(f => f.webkitRelativePath)).toEqual([
      'foo.txt',
      'bar.txt',
    ]);
    expect(result?.map(f => f.name)).toEqual(['foo.txt', 'bar.txt']);

    restoreFileSystemGlobals();
  });

  it('should return array of files from nested folders by using webkitGetAsEntry', async () => {
    mockFileSystemGlobals('entry');

    const dataTransfer = mockDataTransfer([
      {
        kind: 'directory',
        name: 'outer',
        items: [
          {
            kind: 'file',
            name: 'foo.txt',
            value: 'foo',
          },
          {
            kind: 'directory',
            name: 'inner',
            items: [
              {
                kind: 'file',
                name: 'file1.txt',
                value: 'file1',
              },
              {
                kind: 'file',
                name: 'file2.txt',
                value: 'file2',
              },
            ],
          },
        ],
      },
      {
        kind: 'file',
        name: 'bar.txt',
        value: 'bar',
      },
    ]);

    const result = await readFilesFromDataTransfer(dataTransfer);

    expect(result?.map(f => f.webkitRelativePath)).toEqual([
      'outer/foo.txt',
      'outer/inner/file1.txt',
      'outer/inner/file2.txt',
      'bar.txt',
    ]);
    expect(result?.map(f => f.name)).toEqual([
      'foo.txt',
      'file1.txt',
      'file2.txt',
      'bar.txt',
    ]);

    restoreFileSystemGlobals();
  });
});
