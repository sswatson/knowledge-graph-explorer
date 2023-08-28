import { historyField } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { lintGutter, setDiagnostics } from '@codemirror/lint';
import { EditorStateConfig, SelectionRange } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { debounce, get, noop } from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withErrorBoundary } from 'react-error-boundary';

import { rel } from '@relationalai/codemirror-lang-rel';

import {
  highlightRange,
  onChangeListener,
  onSelectionChangeListener,
} from './extensions';
import { setupKeyBindings } from './keybindings';
import { raiSetup } from './setup';
import {
  CodeEditorProps,
  CustomKeyBinding,
  EditorState,
  EditorView,
  LanguageType,
} from './types';
import useBrowserStorage, { BrowserStorageType } from './useBrowserStorage';
import { useExtension } from './useExtension';
import { isValidSelection, safeDispatch, scrollIntoSelection } from './utils';

const languageMap = {
  rel,
  markdown,
};

function CodeEditor(props: CodeEditorProps) {
  return <CodeEditorInner key={props.stateKey} {...props} />;
}

function CodeEditorInner({
  value = '',
  onInit,
  onBlur,
  onChange = noop,
  onUpdate = noop,
  onSelectionChange = noop,
  readOnly = false,
  selection,
  language = LanguageType.REL,
  customKeyBindings = [],
  stateKey,
  editorRef,
  diagnostics = [],
  logKeyStroke,
  gutterHighlightRange,
  extensions,
  ...props
}: CodeEditorProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  const { setItem, getItem } = useBrowserStorage<{ [key: string]: any }>({
    type: BrowserStorageType.SESSION,
    key: 'codeEditorState',
    initialItem: {},
  });

  const createState = (config: EditorStateConfig) => {
    if (stateKey) {
      const stateJson: any = get(getItem(), stateKey);

      if (stateJson && config.doc === stateJson.doc) {
        return EditorState.fromJSON(stateJson, config, {
          history: historyField,
        });
      }
    }

    return EditorState.create(config);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveState = useCallback(
    debounce((state: EditorState) => {
      if (stateKey) {
        const stateJson = state.toJSON({
          history: historyField,
        });

        setItem({
          ...getItem(),
          [stateKey]: stateJson,
        });
      }
    }, 500),
    [stateKey],
  );

  // Default extensions setup
  const baseExtensions = useMemo(
    () => [raiSetup, lintGutter()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const extensionsKeyBindings = useMemo(
    () =>
      extensions?.reduce(
        (all: CustomKeyBinding[], extension) => [
          ...all,
          ...(extension.keyBindings ?? []),
        ],
        [],
      ) ?? [],
    [extensions],
  );

  // Custom extensions
  useExtension(editorView, () => extensions ?? [], [extensions]);
  useExtension(editorView, () => onChangeListener(onChange), [onChange]);
  useExtension(editorView, () => onSelectionChangeListener(onSelectionChange), [
    onSelectionChange,
  ]);
  useExtension(editorView, () => languageMap[language](), [language]);
  useExtension(
    editorView,
    () =>
      keymap.of(
        setupKeyBindings(
          [...customKeyBindings, ...extensionsKeyBindings],
          logKeyStroke,
        ),
      ),
    [customKeyBindings],
  );
  useExtension(editorView, () => EditorState.readOnly.of(readOnly), [readOnly]);
  useExtension(editorView, () => EditorView.updateListener.of(onUpdate), [
    onUpdate,
  ]);
  useExtension(
    editorView,
    () => EditorView.updateListener.of(({ state }) => saveState(state)),

    [stateKey],
  );

  // Initial setup of the state & view
  useEffect(() => {
    if (innerRef.current) {
      const config: EditorStateConfig = {
        doc: value,
        extensions: baseExtensions,
      };

      if (isValidSelection(selection, value.length)) {
        config.selection = selection;
      }

      const view = new EditorView({
        parent: innerRef.current,
      });

      view.setState(createState(config));

      setEditorView(view);

      // Scroll into selection initially if provided
      if (config.selection) {
        scrollIntoSelection(view, config.selection as SelectionRange, {
          y: 'center',
        });
      }

      // Assign the ref as early as possible. We need it for the focusing in notebook cells
      if (editorRef) {
        editorRef.current = view;
      }

      if (onInit) onInit(view);

      // Cleanup
      return () => {
        if (view) {
          view.destroy();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Value change
  useEffect(() => {
    if (editorView) {
      const currentValue = editorView?.state?.doc?.toString() || '';

      if (value !== currentValue) {
        safeDispatch(editorView, {
          changes: { from: 0, to: currentValue.length, insert: value || '' },
        });
      }
    }
  }, [editorView, value]);

  // Selection change
  useEffect(() => {
    const docLength = get(editorView, 'state.doc.length');
    const currentSelection = get(editorView, 'state.selection.main');

    if (
      editorView &&
      docLength &&
      selection &&
      currentSelection &&
      selection instanceof SelectionRange &&
      !selection.eq(currentSelection) &&
      isValidSelection(selection, docLength)
    ) {
      safeDispatch(editorView, { selection });
    }
  }, [selection, editorView]);

  // Diagnostics
  useEffect(() => {
    if (editorView) {
      const filteredDiagnostics = diagnostics.filter(
        d => d.to >= d.from && d.from <= value?.length && d.to <= value?.length,
      );

      safeDispatch(
        editorView,
        setDiagnostics(editorView.state, filteredDiagnostics),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorView, diagnostics]);

  useEffect(() => {
    if (editorView) {
      highlightRange(editorView, gutterHighlightRange);
    }
  }, [editorView, gutterHighlightRange]);

  return (
    <div
      className='code-editor h-full'
      onBlur={onBlur}
      ref={innerRef}
      {...props}
    />
  );
}

const ErrorBoundaryFallbackComponent = () => (
  <div className='p-4 text-sm text-gray-600'>
    ⚠ Internal exception occurred while rendering the code editor.
  </div>
);

const WrappedCodeEditor = withErrorBoundary(CodeEditor, {
  FallbackComponent: ErrorBoundaryFallbackComponent,
});

export default WrappedCodeEditor;
