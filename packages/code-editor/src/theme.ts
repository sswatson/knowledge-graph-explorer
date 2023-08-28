// For more info about CM6 styling https://codemirror.net/6/examples/styling/

import { EditorView } from '@codemirror/view';

export default EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    outline: 'none !important',
    backgroundColor: '#fff',
  },
  '.cm-scroller, .cm-tooltip-autocomplete': {
    fontFamily: 'Menlo, Monaco, Lucida Console, monospace',
  },
  '.cm-tooltip-autocomplete': {
    whiteSpace: 'break-spaces',
  },
  '.cm-completionDetail': {
    fontSize: '13px',
    opacity: '0.8',
  },
  '.cm-completionIcon-relation::after': {
    content: "'R'",
  },
  '.cm-completionIcon-baseRelation::after': {
    content: "'B'",
  },
  '.cm-completionIcon-relname::after': {
    content: "':'",
  },
  '.cm-completionIcon-snippet::after': {
    content: "'❏'",
  },
  '.cm-completionIcon-unicode::after': {
    content: "'U'",
  },
  '.cm-completionIcon-constructor::after': {
    content: "'C'",
  },
  '.cm-completionIcon-module::after': {
    content: "'M'",
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: '#D3E7FD',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: '#FA785F',
  },
  '.cm-rangeHighlight-gutter .cm-gutterElement div': {
    borderRight: '3px solid #F6B2A3',
    height: '100%',
  },
  '.cm-gutters': {
    backgroundColor: '#fff',
    color: '#DEDEDE',
    border: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 2px 0 8px',
  },
  '.cm-content': {
    caretColor: '#0e9',
  },
  '.cm-completionLabel': {
    paddingLeft: '10px',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    background: 'rgb(222 232 255)',
    color: '#000',
  },
  '.cm-tooltip-autocomplete.cm-tooltip.cm-tooltip-below': {
    padding: '2px',
  },
  '.cm-lintRange': {
    paddingBottom: '3.5px',
  },
  '.cm-panel.cm-panel-lint [name=close]': {
    top: '2px',
    right: '10px',
  },
  '.cm-panel.cm-panel-lint ul [aria-selected]': {
    backgroundColor: '#fff1f1',
  },
  '.cm-lint-marker': {
    width: '0.7em',
    height: '0.77em',
  },
  '.cm-gutter-lint': {
    width: '13px',
  },
  '.cm-lint-marker-error:before': {
    top: '-3px',
    position: 'relative',
    cursor: 'help',
    content:
      "url(\"data:image/svg+xml,%3Csvg stroke='red' fill='red' stroke-width='0.5' viewBox='1 -2 26 26' height='0.7em' width='0.7em' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A.998.998 0 0 0 5 3v18a1 1 0 0 0 .536.886zM7 4.909 17.243 12 7 19.091V4.909z'%3E%3C/path%3E%3C/svg%3E\")",
  },
  '.cm-tooltip-lint': {
    backgroundColor: 'white',
    color: '#636363',
    borderRadius: '5px',
  },
  '.cm-tooltip': {
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '5px',
  },
  'li.cm-diagnostic:not(:last-child)': {
    paddingBottom: '10px',
  },
});
