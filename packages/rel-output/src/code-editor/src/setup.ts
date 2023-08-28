/*
  This is an extension value that just pulls together a whole lot of
  extensions that you might want in a basic editor. It is meant as a
  convenient helper to quickly set up CodeMirror without installing
  and importing a lot of packages.

  https://github.com/codemirror/basic-setup/blob/main/src/basic-setup.ts
*/

import { closeBrackets } from '@codemirror/autocomplete';
import { history } from '@codemirror/commands';
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  indentUnit,
} from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import { Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  highlightActiveLineGutter,
  highlightSpecialChars,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';

import {
  indentationMatch,
  multipleSelections,
  rangeHighlightGutter,
} from './extensions';
import raiHighlights from './highlights';
import raiTheme from './theme';

export const raiSetup: Extension = [
  history(),
  raiHighlights,
  raiTheme,
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  multipleSelections,
  foldGutter(),
  rangeHighlightGutter(),
  indentOnInput(),
  indentationMatch,
  bracketMatching(),
  closeBrackets(),
  rectangularSelection(),
  highlightSelectionMatches(),
  indentUnit.of('    '), // 4 spaces per tab
];
