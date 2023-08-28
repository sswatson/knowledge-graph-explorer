import { Completion } from '@relationalai/code-editor';

export type RelCompletion = Completion & {
  type: 'relation' | 'baseRelation' | 'constructor' | 'module';
};

export type CompletionsMap = Map<string, RelCompletion>;
