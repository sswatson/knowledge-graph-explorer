import {
  Extension,
  RangeSet,
  SelectionRange,
  StateEffect,
  StateField,
} from '@codemirror/state';
import { EditorView, gutter, GutterMarker } from '@codemirror/view';

import { isValidSelection } from '../../utils';

// See https://codemirror.net/examples/gutter/

const highlightMarker = new (class extends GutterMarker {
  toDOM() {
    return document.createElement('div');
  }
})();

const highlightEffect = StateEffect.define<{
  lines: number[];
}>({
  map: ({ lines }, mapping) => ({
    lines: lines.map(line => mapping.mapPos(line)),
  }),
});

const clearHighlightEffect = StateEffect.define();

const highlightState = StateField.define<RangeSet<GutterMarker>>({
  create: () => RangeSet.empty,
  update: (set, transaction) => {
    set = set.map(transaction.changes);

    for (const e of transaction.effects) {
      if (e.is(highlightEffect)) {
        set = set.update({
          filter: pos => !e.value.lines.includes(pos),
          add: e.value.lines.map(line => highlightMarker.range(line)),
        });
      } else if (e.is(clearHighlightEffect)) {
        set = RangeSet.empty;
      }
    }

    return set;
  },
});

const highlightLines = (view: EditorView, range: SelectionRange) => {
  if (isValidSelection(range, view.state.doc.length)) {
    let line = view.state.doc.lineAt(range.from);
    const lines = [];

    while (line.from <= range.to) {
      lines.push(line.from);

      // Go to next line
      if (line.to < view.state.doc.length - 1) {
        line = view.state.doc.lineAt(line.to + 1);
      } else {
        break;
      }
    }

    view.dispatch({
      effects: highlightEffect.of({ lines }),
    });
  }
};

export const clearRangeHighlight = (view: EditorView) => {
  view.dispatch({
    effects: clearHighlightEffect.of(null),
  });
};

export const highlightRange = (view: EditorView, range?: SelectionRange) => {
  clearRangeHighlight(view);

  if (range) {
    highlightLines(view, range);
  }
};

export const rangeHighlightGutter = (): Extension => [
  highlightState,
  gutter({
    class: 'cm-rangeHighlight-gutter',
    markers: view => view.state.field(highlightState),
    initialSpacer: () => highlightMarker,
  }),
];
