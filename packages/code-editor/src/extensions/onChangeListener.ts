import { isFunction } from 'lodash-es';

import { EditorView, ViewUpdate } from '../types';
import { clearRangeHighlight } from './rangeHighlightGutter';

export const onChangeListener = (
  onChange: (value: string, vUpdate: ViewUpdate) => void,
) =>
  EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.docChanged && isFunction(onChange)) {
      const doc = viewUpdate.state.doc;
      const value = doc.toString();

      onChange(value, viewUpdate);
      clearRangeHighlight(viewUpdate.view);
    }
  });
