import { SelectionRange } from '@codemirror/state';

import { Diagnostic } from '@relationalai/utils';

import { EditorDiagnostic } from '../types';
import {
  flattenDiagnostics,
  getSelectionRange,
  rangeToFlat,
  rangeToString,
  toEditorDiagnostics,
} from './diagnosticsUtils';

const text = `line1 count 15\n` + `line6\n` + `line3 line3 14`;

const range1 = {
  start: { line: 1, character: 1 },
  end: { line: 3, character: 10 },
};

const range1String = '1,1:3,10';

const flatRange1 = { to: 31, from: 0 };

const range2 = {
  start: { line: 2, character: 1 },
  end: { line: 2, character: 4 },
};

const range2String = '2,1:2,4';

const flatRange2 = { to: 19, from: 15 };

// Invalid line number 4
const invalidRange1 = {
  start: { line: 2, character: 1 },
  end: { line: 4, character: 4 },
};

// Invalid line character 7 on line 2
const inValidRange2 = {
  start: { line: 2, character: 7 },
  end: { line: 3, character: 1 },
};

const diagnostics: Diagnostic[] = [
  {
    code: 'diagnostic1 code',
    message: 'diagnostic1 message',
    severity: 'error',
    range: [
      {
        start: { line: 1, character: 1 },
        end: { line: 1, character: 10 },
      },
      {
        start: { line: 2, character: 1 },
        end: { line: 3, character: 4 },
      },
    ],
  },
  {
    code: 'diagnostic2 code',
    message: 'diagnostic2 message',
    severity: 'warning',
  },
];

const flatDiagnostics: Diagnostic[] = [
  {
    code: 'diagnostic1 code',
    message: 'diagnostic1 message',
    severity: 'error',
    range: [
      {
        start: { line: 1, character: 1 },
        end: { line: 1, character: 10 },
      },
    ],
  },
  {
    code: 'diagnostic1 code',
    message: 'diagnostic1 message',
    severity: 'error',
    range: [
      {
        start: { line: 2, character: 1 },
        end: { line: 3, character: 4 },
      },
    ],
  },
  {
    code: 'diagnostic2 code',
    message: 'diagnostic2 message',
    severity: 'warning',
  },
];

const editorDiagnostics: EditorDiagnostic[] = [
  {
    from: 0,
    to: 10,
    severity: 'error',
    message: '⚠ diagnostic1 code\n\tdiagnostic1 message',
    original: flatDiagnostics[0],
  },
  {
    from: 15,
    to: 25,
    severity: 'error',
    message: '⚠ diagnostic1 code\n\tdiagnostic1 message',
    original: flatDiagnostics[1],
  },
];

describe('Diagnostics utils', () => {
  it('should parse range to string', () => {
    const str1 = rangeToString(range1);

    expect(str1).toEqual(range1String);

    const str2 = rangeToString(range2);

    expect(str2).toEqual(range2String);
  });

  it('should generate selection range from a given string', () => {
    expect(getSelectionRange(range1String, text)).toEqual(
      SelectionRange.fromJSON({
        head: 31,
        anchor: 0,
      }),
    );

    expect(getSelectionRange(range2String, text)).toEqual(
      SelectionRange.fromJSON({
        head: 19,
        anchor: 15,
      }),
    );

    expect(getSelectionRange('10:18', text)).toEqual(
      SelectionRange.fromJSON({
        head: 18,
        anchor: 10,
      }),
    );

    expect(getSelectionRange('18:10', text)).toEqual(
      SelectionRange.fromJSON({
        head: 10,
        anchor: 18,
      }),
    );
  });

  it('should generate flat range', () => {
    const flat1 = rangeToFlat(range1, text);

    expect(flat1).toEqual(flatRange1);

    const flat2 = rangeToFlat(range2, text);

    expect(flat2).toEqual(flatRange2);
  });

  it('should return undefined for invalid ranges', () => {
    const flat1 = rangeToFlat(invalidRange1, text);

    expect(flat1).toEqual(undefined);

    const flat2 = rangeToFlat(inValidRange2, text);

    expect(flat2).toEqual(undefined);
  });

  it('should flatten diagnostics', () => {
    expect(flattenDiagnostics(diagnostics)).toEqual(flatDiagnostics);
  });

  it('should get editor diagnostics with valid text', () => {
    expect(toEditorDiagnostics(flatDiagnostics, text)).toEqual(
      editorDiagnostics,
    );
  });

  it('should get editor diagnostics only for first line diagnostics.', () => {
    expect(toEditorDiagnostics(flatDiagnostics, 'only one line text')).toEqual([
      editorDiagnostics[0],
    ]);
  });

  it('should not return any editor diagnostics with empty text', () => {
    expect(toEditorDiagnostics(flatDiagnostics, '')).toEqual([]);
  });
});
