import { EditorState, Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export const multipleSelections: Extension = [
  EditorState.allowMultipleSelections.of(true),
  EditorView.clickAddsSelectionRange.of((event: MouseEvent) => event.altKey),
];
