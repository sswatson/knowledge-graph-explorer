import { SelectionRange } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';

export const onSelectionChangeListener = (
  onSelectionChange: (
    selection: SelectionRange,
    viewUpdate: ViewUpdate,
  ) => void,
) =>
  EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    const oldSelection = viewUpdate.startState.selection.main;
    const newSelection = viewUpdate.state.selection.main;

    // See: https://discuss.codemirror.net/t/viewupdate-s-selectionset-is-named-differently-than-focuschanged/4359/4
    if (!oldSelection.eq(newSelection)) {
      return onSelectionChange(newSelection, viewUpdate);
    }
  });
