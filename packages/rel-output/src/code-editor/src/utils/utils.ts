import { Diagnostic as CodeMirrorDiagnostic } from '@codemirror/lint';
import { Line, SelectionRange, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { inRange, isArray } from 'lodash-es';

import { Diagnostic, IcViolation, Range } from '@relationalai/utils';

import { ScrollOptions } from '../types';

// Dispatches scrollIntoView effect to the editor
export function scrollIntoSelection(
  view: EditorView,
  selection: SelectionRange,
  options?: ScrollOptions,
) {
  safeDispatch(view, {
    selection,
    effects: [EditorView.scrollIntoView(selection, options)],
  });
}

// Dispatches select range transaction to the editor
export const forceSelection = (
  editorView?: EditorView | undefined | null,
  selection?: SelectionRange,
) => {
  if (editorView) {
    editorView.focus();

    const document = editorView.state.doc;

    if (selection && isValidSelection(selection, document.length)) {
      scrollIntoSelection(editorView, selection, { y: 'center' });
    }
  }
};

// With passed Rai SDK Diagnostic severity get the Code Mirror severity mapping
export const getCodeMirrorSeverity = (
  severity: Diagnostic['severity'],
): CodeMirrorDiagnostic['severity'] => {
  switch (severity) {
    case 'info':
    case 'suggestion':
      return 'info';
    case 'error':
    case 'exception':
      return 'error';
    default:
      return 'warning';
  }
};

const offsetRange = (
  range: Range,
  selection: SelectionRange,
  startLine: Pick<Line, 'number' | 'from' | 'to'>,
): Range => {
  const charOffset = selection.from - startLine.from;
  const lineOffset =
    startLine.number > 0 ? startLine.number - 1 : startLine.number;

  const newStartLine = lineOffset + range.start.line;
  const newEndLine = lineOffset + range.end.line;

  return {
    start: {
      line: newStartLine,
      character:
        newStartLine > startLine.number
          ? range.start.character
          : charOffset + range.start.character,
    },
    end: {
      line: newEndLine,
      character:
        newEndLine > startLine.number
          ? range.end.character
          : charOffset + range.end.character,
    },
  };
};

export const offsetPartialQueryDiagnostics = <
  T extends Diagnostic | IcViolation
>(
  diagnostics: T[],
  selection: SelectionRange,
  startLine: Pick<Line, 'number' | 'from' | 'to'>,
): T[] =>
  diagnostics.map((diag: T) =>
    !diag.model && diag.range
      ? {
          ...diag,
          range: isArray(diag.range)
            ? diag.range.map(range => offsetRange(range, selection, startLine))
            : offsetRange(diag.range, selection, startLine),
        }
      : diag,
  );

export function safeDispatch(
  editorView: EditorView,
  ...args: TransactionSpec[]
) {
  let tryNumber = 0;

  function callDispatch() {
    try {
      editorView.dispatch(...args);
    } catch (error: any) {
      if (tryNumber < 5) {
        tryNumber++;
        setTimeout(callDispatch, 0);
      } else {
        throw error;
      }
    }
  }

  callDispatch();
}

export function isValidSelection(
  sel: SelectionRange | undefined,
  docLength: number,
) {
  const from = sel?.from || sel?.anchor || 0;
  const to = sel?.to || sel?.head || 0;

  return inRange(from, docLength + 1) && inRange(to, from, docLength + 1);
}
