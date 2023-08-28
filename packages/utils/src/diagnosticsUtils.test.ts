import { filterDuplicateDiagnostics } from './diagnosticsUtils';
import { Diagnostic } from './relationUtils';

describe('Diagnostics utils', () => {
  it('should filter out duplicate diagnostics', () => {
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
      {
        code: 'diagnostic2 code',
        message: 'diagnostic2 message',
        severity: 'warning',
      },
      {
        code: 'diagnostic3 code',
        message: 'diagnostic3 message',
        severity: 'error',
      },
    ];

    expect(filterDuplicateDiagnostics(diagnostics, 2)).toEqual([
      diagnostics[0],
      diagnostics[1],
      diagnostics[3],
      diagnostics[4],
      diagnostics[5],
    ]);
    expect(filterDuplicateDiagnostics(diagnostics, 1)).toEqual([
      diagnostics[0],
      diagnostics[3],
      diagnostics[5],
    ]);
  });
});
