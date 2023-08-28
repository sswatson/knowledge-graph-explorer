import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
  CustomExtension,
  getDeclarationNode,
  isDescendantOfType,
  isUnknownNodeType,
  lastLeaf,
  relTerms,
  SyntaxNode,
  syntaxTree,
} from '@relationalai/code-editor';

import { RelDefinition } from '../types';
import {
  annotationKeywordOptions,
  booleanOptions,
  declarationOptions,
  emphasisOptions,
  mainKeywordOptions,
  MATCH_REGEX,
} from './constants';
import { autoCompletionKeymap } from './keybindings';
import { RelCompletion } from './types';
import { unicodeOptions } from './unicode.constants';
import { defsToCompletions, patternMatch } from './utils';

function completionResult(
  context: CompletionContext,
  nodeBefore: SyntaxNode,
  completionsList: Completion[],
): CompletionResult {
  return {
    from: nodeBefore.from,
    options: completionsList.filter(completion =>
      patternMatch(
        context.state.sliceDoc(nodeBefore.from, nodeBefore.to),
        completion.label,
      ),
    ),
    update: (current, from, to, updateContext) => ({
      ...current,
      from,
      to,
      options: completionsList.filter(completion =>
        patternMatch(updateContext.state.sliceDoc(from, to), completion.label),
      ),
    }),
  };
}

function completeAnnotation(
  context: CompletionContext,
  nodeBefore: SyntaxNode,
): ReturnType<CompletionSource> {
  return completionResult(context, nodeBefore, annotationKeywordOptions);
}

function completeLhs(
  context: CompletionContext,
  nodeBefore: SyntaxNode | null,
  completions: RelCompletion[],
): ReturnType<CompletionSource> {
  if (!nodeBefore) {
    return null;
  }

  return completionResult(context, nodeBefore, [
    ...completions,
    ...booleanOptions,
  ]);
}

function completeKeyword(
  context: CompletionContext,
  nodeBefore: SyntaxNode,
): ReturnType<CompletionSource> {
  return completionResult(context, nodeBefore, [
    ...mainKeywordOptions,
    ...declarationOptions,
  ]);
}

function completeEmphasis(
  context: CompletionContext,
  nodeBefore: SyntaxNode,
): ReturnType<CompletionSource> {
  return completionResult(context, nodeBefore, emphasisOptions);
}

function completeConstructor(
  context: CompletionContext,
  nodeBefore: SyntaxNode | null,
  completions: RelCompletion[],
): ReturnType<CompletionSource> {
  if (!nodeBefore) {
    return null;
  }

  return completionResult(context, nodeBefore, completions);
}

export const completeRel = ({
  lhsCompletions,
  constructorCompletions,
}: {
  lhsCompletions: RelCompletion[];
  constructorCompletions: RelCompletion[];
}) => async (context: CompletionContext) => {
  const tree = syntaxTree(context.state);
  const nodeBefore = tree.resolveInner(context.pos, -1);
  const lastLeafBefore = lastLeaf(nodeBefore.childBefore(context.pos));
  const textBefore = context.state.sliceDoc(nodeBefore.from, nodeBefore.to);
  const parentTextBefore = context.state.sliceDoc(
    nodeBefore.parent?.from,
    nodeBefore.parent?.to,
  );
  const nodeType = nodeBefore.type.id;
  const parentType = nodeBefore.parent?.type.id;
  const nodeDeclarationType = getDeclarationNode(nodeBefore)?.type.id;

  const unicodeQueryMatch = context.matchBefore(MATCH_REGEX.UNICODE_REGEX);

  if (unicodeQueryMatch) {
    return {
      from: unicodeQueryMatch.from,
      options: unicodeOptions,
    };
  }

  switch (nodeType) {
    case relTerms.LineComment:
    case relTerms.BlockComment:
    case relTerms.StaticStringLiteral:
    case relTerms.StaticMultilineStringLiteral:
    case relTerms.RawStringSequence:
      return null;
  }

  if (
    MATCH_REGEX.CONSTRUCTOR_REGEX.test(textBefore) &&
    (nodeType === relTerms.Operator || nodeType === relTerms.ConstructorId)
  ) {
    return completeConstructor(context, nodeBefore, constructorCompletions);
  }

  if (
    MATCH_REGEX.ANNOTATION_REGEX.test(textBefore) &&
    (nodeType === relTerms.AnnotationKeyword ||
      parentType === relTerms.AnnotationKeyword)
  ) {
    return completeAnnotation(context, nodeBefore);
  }

  if (
    MATCH_REGEX.WORD_REGEX.test(textBefore) &&
    parentType === relTerms.BasicExpression &&
    nodeType === relTerms.BasicId
  ) {
    return completeLhs(context, nodeBefore, lhsCompletions);
  }

  if (
    MATCH_REGEX.RELNAME_REGEX.test(textBefore) &&
    isDescendantOfType(nodeBefore, relTerms.Expression)
  ) {
    return completeLhs(context, lastLeafBefore, lhsCompletions);
  }

  if (
    MATCH_REGEX.RELNAME_REGEX.test(parentTextBefore) &&
    isDescendantOfType(nodeBefore, relTerms.Expression)
  ) {
    return completeLhs(context, nodeBefore.parent, lhsCompletions);
  }

  if (
    MATCH_REGEX.WORD_REGEX.test(textBefore) &&
    isUnknownNodeType(nodeBefore.parent) &&
    nodeType === relTerms.BasicId
  ) {
    return completeKeyword(context, nodeBefore);
  }

  if (
    MATCH_REGEX.WORD_REGEX.test(textBefore) &&
    parentType === relTerms.LhsId &&
    nodeType === relTerms.BasicId &&
    nodeDeclarationType === relTerms.DefinitionStatement
  ) {
    return completeEmphasis(context, nodeBefore);
  }

  return null;
};

export const autoCompletion = (
  definitions: RelDefinition[],
): CustomExtension => {
  const completions = Array.from(defsToCompletions(definitions).values());

  return {
    extension: autocompletion({
      override:
        completions.length > 0
          ? [
              completeRel({
                lhsCompletions: completions.filter(c =>
                  ['relation', 'module'].includes(c.type),
                ),
                constructorCompletions: completions,
              }),
            ]
          : [],
      defaultKeymap: false,
      interactionDelay: 200,
    }),
    keyBindings: autoCompletionKeymap,
  };
};

export * from './types';
export * from './utils';
