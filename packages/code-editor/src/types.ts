import { Diagnostic as CodeMirrorDiagnostic } from '@codemirror/lint';
import { Extension, SelectionRange } from '@codemirror/state';
import { EditorView, KeyBinding, ViewUpdate } from '@codemirror/view';
import { MutableRefObject } from 'react';

import { Diagnostic } from '@relationalai/utils';

export enum LanguageType {
  REL = 'rel',
  MARKDOWN = 'markdown',
}

export type LocalState = {
  [name: string]: {
    value: string;
    selection?: SelectionRange;
    lastTimeModified?: Number;
    history?: Object;
  };
};

export type CustomKeyBinding = Omit<KeyBinding, 'run'> & {
  run: KeyBinding['run'] | ((editorView: EditorView) => void);
  description?: string;
};

export type CustomExtension = {
  extension: Extension;
  keyBindings?: readonly CustomKeyBinding[];
};

export type CodeEditorProps = {
  value?: string;
  height?: string;
  selection?: SelectionRange;
  readOnly?: boolean;
  extensions?: CustomExtension[];
  language?: LanguageType;
  customKeyBindings?: CustomKeyBinding[];
  // stateKey is used to restore editor state from the local/session storage
  // changing key re-mounts the whole editor component
  // also, the state is restored only when
  // the value prop matches the value the state was created for
  stateKey?: string;
  onChange?: (value: string, vUpdate: ViewUpdate) => void;
  onUpdate?: (viewUpdate: ViewUpdate) => void;
  onSelectionChange?: (
    selection: SelectionRange,
    viewUpdate: ViewUpdate,
  ) => void;
  onBlur?: () => void;
  onInit?: (view: EditorView) => void;
  editorRef?: MutableRefObject<EditorView | undefined>;
  diagnostics?: EditorDiagnostic[];
  logKeyStroke?: (key: string, message?: string) => void;
  gutterHighlightRange?: SelectionRange;
};

export type Focusable = {
  focus: () => void;
};

export type EditorDiagnostic = CodeMirrorDiagnostic & {
  original?: Diagnostic;
};

export type ScrollStrategy = 'nearest' | 'start' | 'end' | 'center';

// The same options type used in https://codemirror.net/docs/ref/#view.EditorView^scrollIntoView
export type ScrollOptions = {
  y?: ScrollStrategy;
  x?: ScrollStrategy;
  yMargin?: number;
  xMargin?: number;
};

export * from '@codemirror/autocomplete';
export * from '@codemirror/language';
export * from '@codemirror/state';
export * from '@codemirror/view';
export * from '@lezer/common';
