import { SelectionRange, Text } from '@codemirror/state';
import { isEmpty } from 'lodash-es';

import { Diagnostic, Pos, Range } from '@relationalai/utils';

import { EditorDiagnostic } from '../types';
import { getCodeMirrorSeverity } from './utils';

export type FlatRange = {
  to: number;
  from: number;
};

export function toEditorDiagnostics(
  diagnostics: Diagnostic[],
  text: string,
): EditorDiagnostic[] {
  const _diagnostics = flattenDiagnostics(diagnostics);
  const diagnosticsWithRange = _diagnostics.filter(
    diag => diag.range && diag.range.length > 0,
  );

  return diagnosticsWithRange
    .map(diag => editorDiagnosticsMapper(diag, text))
    .filter(d => !!d) as EditorDiagnostic[];
}

export function flattenDiagnostics(diagnostics: Diagnostic[]) {
  const flatDiagnostics: Diagnostic[] = [];

  diagnostics.forEach(diag => {
    if (diag.range && diag.range.length > 0) {
      diag.range?.forEach(r => {
        flatDiagnostics.push({ ...diag, range: [r] });
      });
    } else {
      flatDiagnostics.push(diag);
    }
  });

  return flatDiagnostics;
}

const editorDiagnosticsMapper = (diagnostic: Diagnostic, text: string) => {
  const flatRange = diagnostic.range && rangeToFlat(diagnostic.range[0], text);

  // return undefined when the range and the lastUsedValue are incompatible
  if (flatRange) {
    return {
      from: flatRange.from,
      to: flatRange.to,
      message: `⚠ ${diagnostic.code ?? ''}\n\t${diagnostic.message ?? ''}`,
      severity: getCodeMirrorSeverity(diagnostic.severity),
      original: diagnostic,
    };
  }
};

export function rangeToString(range: Range) {
  return `${range.start.line},${range.start.character}:${range.end.line},${range.end.character}`;
}

export function getSelectionRange(
  rangeStr: string,
  text?: string,
): SelectionRange | undefined {
  if (!isEmpty(rangeStr)) {
    const [startStr, endStr] = rangeStr.split(':');
    const startParts = startStr.split(',').map(x => Number.parseInt(x));
    const endParts = endStr.split(',').map(x => Number.parseInt(x));

    if (startParts.length == 1 && endParts.length == 1) {
      // If the range format is #:# (from:to)
      return SelectionRange.fromJSON({
        head: endParts[0],
        anchor: startParts[0],
      });
    } else if (startParts.length == 2 && endParts.length == 2 && text) {
      // If the range format is #,#:#,# (fromLine,fromChar:toLine,toChar)
      const flatRange = rangeToFlat(
        {
          start: { line: startParts[0], character: startParts[1] },
          end: { line: endParts[0], character: endParts[1] },
        } as Range,
        text,
      );

      return (
        flatRange &&
        SelectionRange.fromJSON({
          anchor: flatRange.from,
          head: flatRange.to,
        })
      );
    }
  }
}

export function rangeToFlat(range: Range, text: string) {
  try {
    const document = Text.of(text.split('\n'));
    const from = posToIndex(range.start, document) - 1;
    const to = posToIndex(range.end, document);

    return { to, from } as FlatRange;
  } catch {
    return undefined;
  }
}

const posToIndex = (pos: Pos, document: Text) => {
  if (
    document.lines >= pos.line &&
    document.line(pos.line).length >= pos.character
  ) {
    return document.line(pos.line).from + pos.character;
  }

  throw new Error('Not valid position');
};
