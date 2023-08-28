import {
  acceptCompletion,
  closeCompletion,
  CustomKeyBinding,
  moveCompletionSelection,
  nextSnippetField,
  startCompletion,
} from '@relationalai/code-editor';

export const autoCompletionKeymap: readonly CustomKeyBinding[] = [
  { key: 'Ctrl-Space', run: startCompletion, description: 'Start completion' },
  { key: 'Mod-Escape', run: startCompletion, description: 'Start completion' },
  { key: 'Escape', run: closeCompletion, description: 'Close completion' },
  {
    key: 'ArrowDown',
    run: moveCompletionSelection(true),
    description: 'Move completion selection',
  },
  {
    key: 'ArrowUp',
    run: moveCompletionSelection(false),
    description: 'Move completion selection',
  },
  {
    key: 'PageDown',
    run: moveCompletionSelection(true, 'page'),
    description: 'Move completion selection',
  },
  {
    key: 'PageUp',
    run: moveCompletionSelection(false, 'page'),
    description: 'Move completion selection',
  },
  { key: 'Tab', run: acceptCompletion, description: 'Accept completion' },
  { key: 'Enter', run: acceptCompletion, description: 'Accept completion' },
  { key: 'Enter', run: nextSnippetField, description: 'Next snippet field' },
];
