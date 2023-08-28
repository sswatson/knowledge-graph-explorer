import { SelectionRange } from '@codemirror/state';
import { waitFor } from '@testing-library/react';
import { cloneDeep } from 'lodash-es';

import { Diagnostic, IcViolation } from '@relationalai/utils';

import { forceSelection, offsetPartialQueryDiagnostics, safeDispatch } from '.';

describe('CodeEditor utils', () => {
  it('should re-try dispatch in safeDispatch', async () => {
    let counter = 0;
    const editorMock = {
      dispatch: jest.fn().mockImplementation(() => {
        counter++;

        if (counter < 4) {
          throw new Error('an error');
        }
      }),
    };

    safeDispatch(editorMock as any, {});

    await waitFor(() => {
      expect(editorMock.dispatch).toHaveBeenCalledTimes(4);
    });
  });

  it('should offset diagnostic ranges on partial query execution', async () => {
    // Test text: ["def a = 1"],["   def b = foo"], ["def c = 4"]
    const diagnostics: Diagnostic[] = [
      {
        range: [
          {
            start: {
              line: 1,
              character: 9,
            },
            end: {
              line: 1,
              character: 11,
            },
          },
        ],
        message: '`foo` is undefined.',
        severity: 'error',
        code: 'UNDEFINED',
        report: '...',
      },
    ];

    const clone: Diagnostic[] = cloneDeep(diagnostics);

    // Selection from start of the 2nd line to the end of 3rd line
    let result = offsetPartialQueryDiagnostics(
      diagnostics,
      SelectionRange.fromJSON({ anchor: 10, head: 34 }),
      {
        number: 2,
        from: 10,
        to: 24,
      },
    );

    expect(result[0].range?.[0].start.line).toEqual(2);
    expect(result[0].range?.[0].end.line).toEqual(2);
    expect(result[0].range?.[0].start.character).toEqual(9);
    expect(result[0].range?.[0].end.character).toEqual(11);

    // Make sure there was no mutation of the input diagnositcs
    expect(clone).toStrictEqual(diagnostics);

    // Selection from start of text at the 2nd line to the end of 2nd line
    result = offsetPartialQueryDiagnostics(
      diagnostics,
      SelectionRange.fromJSON({ anchor: 13, head: 24 }),
      { number: 2, from: 10, to: 24 },
    );
    expect(result[0].range?.[0].start.line).toEqual(2);
    expect(result[0].range?.[0].end.line).toEqual(2);
    expect(result[0].range?.[0].start.character).toEqual(12);
    expect(result[0].range?.[0].end.character).toEqual(14);

    // Selection from start of text at the 1st line to the end of document
    result = offsetPartialQueryDiagnostics(
      diagnostics,
      SelectionRange.fromJSON({ anchor: 0, head: 34 }),
      { number: 1, from: 0, to: 9 },
    );
    expect(result[0].range?.[0].start.line).toEqual(1);
    expect(result[0].range?.[0].end.line).toEqual(1);
    expect(result[0].range?.[0].start.character).toEqual(9);
    expect(result[0].range?.[0].end.character).toEqual(11);
  });

  it('should not offest model diagnostics', () => {
    const diagnostics: Diagnostic[] = [
      {
        range: [
          {
            start: {
              line: 1,
              character: 9,
            },
            end: {
              line: 1,
              character: 11,
            },
          },
        ],
        message: '`foo` is undefined.',
        severity: 'error',
        code: 'UNDEFINED',
        report: '...',
        model: 'model-test',
      },
    ];

    const result = offsetPartialQueryDiagnostics(
      diagnostics,
      SelectionRange.fromJSON({ anchor: 10, head: 34 }),
      {
        number: 2,
        from: 10,
        to: 24,
      },
    );

    expect(result[0]).toEqual(diagnostics[0]);
  });

  it('should offset ic violations ranges on partial query execution', async () => {
    const icViolations: IcViolation[] = [
      {
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 11,
          },
        },
        decl_id: 'ic_id',
        report: '...',
        output: [],
      },
    ];

    const result = offsetPartialQueryDiagnostics(
      icViolations,
      SelectionRange.fromJSON({ anchor: 10, head: 34 }),
      {
        number: 2,
        from: 10,
        to: 24,
      },
    );

    expect(result[0].range?.start.line).toEqual(2);
    expect(result[0].range?.end.line).toEqual(2);
    expect(result[0].range?.start.character).toEqual(9);
    expect(result[0].range?.end.character).toEqual(11);
  });

  it('should offset diagnostic on partial query execution ranges without they going outside of the user selected range', () => {
    // Selection starts at "1" to end of the 2nd line - same text/value as the above partial query test
    const result = offsetPartialQueryDiagnostics(
      [
        {
          range: [
            {
              start: {
                line: 1,
                character: 9,
              },
              end: {
                line: 1,
                character: 9,
              },
            },
          ],
          message: 'parse error',
          severity: 'error',
          code: 'PARSE_ERROR',
          report: '...',
        },
        {
          range: [
            {
              start: {
                line: 2,
                character: 12,
              },
              end: {
                line: 2,
                character: 14,
              },
            },
          ],
          message: '`foo` is undefined.',
          severity: 'error',
          code: 'UNDEFINED',
          report: '...',
        },
      ],
      SelectionRange.fromJSON({ anchor: 9, head: 24 }),
      { number: 1, from: 0, to: 9 },
    );

    expect(result[0].range[0].start.line).toEqual(1);
    expect(result[0].range[0].end.line).toEqual(1);
    expect(result[0].range[0].start.character).toEqual(18);
    expect(result[0].range[0].end.character).toEqual(18);

    expect(result[1].range[0].start.line).toEqual(2);
    expect(result[1].range[0].end.line).toEqual(2);
    expect(result[1].range[0].start.character).toEqual(12);
    expect(result[1].range[0].end.character).toEqual(14);
  });

  it('should force selection only if in range', () => {
    const editorMock = {
      dispatch: jest.fn(),
      focus: jest.fn(),
      state: {
        doc: { length: 10 },
      },
    };

    forceSelection(editorMock as any, { anchor: -1, head: 3 } as any);
    expect(editorMock.dispatch).toHaveBeenCalledTimes(0);

    forceSelection(editorMock as any, { anchor: 0, head: 12 } as any);
    expect(editorMock.dispatch).toHaveBeenCalledTimes(0);

    forceSelection(editorMock as any, { anchor: 12, head: 3 } as any);
    expect(editorMock.dispatch).toHaveBeenCalledTimes(0);

    forceSelection(editorMock as any, { anchor: 0, head: 9 } as any);
    expect(editorMock.dispatch).toHaveBeenCalledTimes(1);

    forceSelection(editorMock as any, { anchor: 5, head: 10 } as any);
    expect(editorMock.dispatch).toHaveBeenCalledTimes(2);

    forceSelection(editorMock as any, { anchor: 10, head: 10 } as any);
    expect(editorMock.dispatch).toHaveBeenCalledTimes(3);
  });
});
