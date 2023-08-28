import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const raiStyle = HighlightStyle.define([
  { tag: [tags.lineComment, tags.blockComment], color: '#b0afb0' },
  { tag: [tags.keyword, tags.operatorKeyword], color: '#708' },
  { tag: tags.link, textDecoration: 'underline' },
  { tag: tags.heading, textDecoration: 'underline', fontWeight: 'bold' },
  {
    tag: tags.emphasis,
    fontWeight: 'bold',
    color: '#2c9905',
  },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  {
    tag: [tags.bool, tags.url],
    color: '#219',
  },
  { tag: [tags.literal, tags.number], color: '#164' },
  { tag: [tags.string, tags.character], color: '#c0968b' },
  { tag: tags.docString, color: '#c57363' },
  { tag: [tags.regexp, tags.escape, tags.special(tags.string)], color: '#e40' },
  { tag: [tags.variableName, tags.labelName], color: '#00f' },
  { tag: tags.attributeName, color: '#000' },
  { tag: [tags.typeName, tags.namespace], color: '#085' },
  { tag: tags.invalid, color: '#f00' },
]);

export default syntaxHighlighting(raiStyle, { fallback: true });
