import {
  Command,
  CustomKeyBinding,
  EditorView,
} from '@relationalai/code-editor';

import {
  referencesTooltipEffect,
  referencesTooltipField,
  setSelectedReference,
} from './tooltips';

export const moveReferenceSelection = (forward: boolean): Command => (
  view: EditorView,
): boolean => {
  const refsState = view.state.field(referencesTooltipField, false);

  if (!refsState) {
    return false;
  }

  const { refs, selectedIndex } = refsState;

  view.dispatch({
    effects: setSelectedReference.of(
      forward
        ? (selectedIndex + 1) % refs.length
        : (selectedIndex - 1 + refs.length) % refs.length,
    ),
  });

  return true;
};

export const closeReferences: Command = (view: EditorView): boolean => {
  const refsState = view.state.field(referencesTooltipField, false);

  if (!refsState) {
    return false;
  }

  view.dispatch({
    effects: [
      referencesTooltipEffect.of({
        isShown: false,
      }),
    ],
  });

  return true;
};

export const acceptReference: Command = (view: EditorView): boolean => {
  const refsState = view.state.field(referencesTooltipField, false);

  if (!refsState) {
    return false;
  }

  const ref = refsState.refs[refsState.selectedIndex];

  if (ref) {
    refsState.onRefSelect?.(ref);
    closeReferences(view);
  }

  return true;
};

export const codeNavigationKeymap: readonly CustomKeyBinding[] = [
  { key: 'ArrowDown', run: moveReferenceSelection(true) },
  { key: 'ArrowUp', run: moveReferenceSelection(false) },
  { key: 'Enter', run: acceptReference },
  { key: 'Escape', run: closeReferences },
];
