import { Completion, snippet } from '@relationalai/code-editor';

// See https://codemirror.net/docs/ref/#autocomplete.Completion.boost
const MAX_BOOST = 99;

export const annotationKeywordOptions: Completion[] = [
  'function',
  'inline',
  'ondemand',
  'outline',
  'static',
].map(tag => ({
  label: `@${tag}`,
  type: 'keyword',
}));

export const declarationOptions: Completion[] = [
  {
    label: 'module/end',
    template: 'module ${module_name}\n\t${}\nend',
  },
  {
    label: 'with/use',
    template: 'with ${module_name} use ${relation_name}',
  },
  {
    label: 'with/use/as',
    template: 'with ${module_name} use ${relation_name} as ${alias}',
  },
  {
    label: 'value/type',
    template: 'value type ${} = ${}',
  },
  {
    label: 'entity/type',
    template: 'entity type ${} = ${}',
  },
  {
    label: 'ic/{}',
    template: 'ic ${ic_name} {\n\t${}\n}',
  },
].map(completion => ({
  ...completion,
  label: `{${completion.label}}`,
  apply: snippet(completion.template),
  type: 'snippet',
  boost: MAX_BOOST,
}));

export const mainKeywordOptions: Completion[] = [
  'def',
  'doc',
  'end',
  'entity',
  'ic',
  'module',
  'type',
  'value',
  'with',
  'bound',
].map(tag => ({
  apply: `${tag} `,
  label: tag,
  type: 'keyword',
}));

export const emphasisOptions: Completion[] = [
  'output',
  'insert',
  'delete',
  'abort',
  'export',
].map(tag => ({
  label: tag,
  type: 'interface',
}));

export const booleanOptions: Completion[] = ['true', 'false'].map(tag => ({
  label: tag,
  type: 'keyword',
  boost: MAX_BOOST,
}));

export const MATCH_REGEX = {
  UNICODE_REGEX: /\\\S*$/,
  ANNOTATION_REGEX: /@\w*$/,
  WORD_REGEX: /\w*$/,
  RELNAME_REGEX: /\w+:\w*$/,
  CONSTRUCTOR_REGEX: /\^\w*$/,
};
