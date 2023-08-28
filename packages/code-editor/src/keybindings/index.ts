import { closeBracketsKeymap } from '@codemirror/autocomplete';
import {
  defaultKeymap,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { foldKeymap } from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { searchKeymap } from '@codemirror/search';
import { EditorView, KeyBinding } from '@codemirror/view';
import { isIOS, isMacOs, isWindows } from 'react-device-detect';

import { CustomKeyBinding } from '../types';

const raiKeyBindings: readonly (KeyBinding | CustomKeyBinding)[] = [
  ...closeBracketsKeymap,
  ...defaultKeymap,
  ...searchKeymap,
  ...historyKeymap,
  ...foldKeymap,
  ...lintKeymap,
  indentWithTab,
];

export const setupKeyBindings = (
  customBindings: readonly CustomKeyBinding[],
  logKeyBinding?: (key: string, message?: string, error?: unknown) => void,
): KeyBinding[] => {
  const allKeyBindings = [
    ...customBindings.map(binding => {
      return {
        ...binding,
        /* The run return value can override other same-shortcut keybinding
         * when it's true, so for custom keybindings, they will take precedence
         * if the return value is exactly not false, since outsider keybindings might
         * return non-boolean values.
         */
        run: (editorView: EditorView) => binding.run?.(editorView) !== false,
      };
    }),
    ...raiKeyBindings,
  ];

  return allKeyBindings.map(binding => {
    const command = binding.run;
    const description = (binding as CustomKeyBinding).description;
    let key = binding.key ?? '';

    if ((isIOS || isMacOs) && binding.mac) {
      key = binding.mac;
    } else if (isWindows && binding.win) {
      key = binding.win;
    } else if (!isWindows && !isIOS && !isMacOs && binding.linux) {
      key = binding.linux;
    }

    // To match other console keybindings pattern
    key = key.replace(/-/g, '+');

    return {
      ...binding,
      run: (editorView: EditorView) => {
        let result = undefined;

        try {
          result = command?.(editorView);

          if (result) {
            logKeyBinding?.(key, description);
          }
        } catch (error) {
          logKeyBinding?.(key, description);
          throw error;
        }

        return result ?? false;
      },
    };
  });
};
