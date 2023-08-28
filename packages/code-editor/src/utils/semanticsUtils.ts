import { SyntaxNode, SyntaxNodeRef } from '@lezer/common';

import { relLanguage, relTerms } from '@relationalai/codemirror-lang-rel';

export const DECLARATION_STATEMENTS: number[] = [
  relTerms.DefinitionStatement,
  relTerms.ModuleStatement,
  relTerms.BoundStatement,
  relTerms.ConstraintStatement,
  relTerms.UseStatement,
  relTerms.EntityTypeStatement,
  relTerms.ValueTypeStatement,
];

export const CONSTRAINT_STATEMENTS: number[] = [
  relTerms.ConstraintStatement,
  relTerms.BoundStatement,
];

export function isUnknownNodeType(node: SyntaxNode | null) {
  return node?.name === '⚠';
}

export function getDeclarationNode(node: SyntaxNode | null): SyntaxNode | null {
  if (node === null) {
    return null;
  }

  if (DECLARATION_STATEMENTS.includes(node.type.id)) {
    return node;
  }

  return getDeclarationNode(node.parent);
}

export function isDescendantOfType(
  node: SyntaxNode | null,
  typeId: number,
): boolean {
  if (!node || !node.parent) {
    return false;
  }

  if (node.parent.type.id === typeId) {
    return true;
  }

  return isDescendantOfType(node.parent, typeId);
}

export function lastLeaf(node: SyntaxNode | null): SyntaxNode | null {
  if (!node) {
    return null;
  }

  if (!node?.lastChild) {
    return node;
  }

  return lastLeaf(node.lastChild);
}

export function nodeContent(srcStr: string, node: SyntaxNode | null): string {
  if (!node) {
    return '';
  }

  return srcStr.slice(node.from, node.to);
}

export function firstLeaf(node?: SyntaxNode | null): SyntaxNode | null {
  if (!node) {
    return null;
  }

  if (!node?.firstChild) {
    return node;
  }

  return firstLeaf(node.firstChild);
}

export function getOutputGroups(relCode: string): string[] {
  const groups: string[] = [];

  if (relCode) {
    relLanguage.parser.parse(relCode).iterate({
      enter: (nodeRef: SyntaxNodeRef) => {
        const nodeTypeId = nodeRef.type.id;
        const parentTypeId = nodeRef.node.parent?.type.id;

        if (
          nodeTypeId === relTerms.QualifiedName &&
          parentTypeId === relTerms.LhsId &&
          nodeContent(relCode, firstLeaf(nodeRef.node.firstChild)) === 'output'
        ) {
          /* Get the first relname after `output` e.g:
           * def output:test:test2 = 1
           *           ^^^^^
           */
          groups.push(
            nodeContent(
              relCode,
              firstLeaf(nodeRef.node.firstChild?.nextSibling),
            ),
          );
        } else if (nodeTypeId === relTerms.Expression) {
          if (
            nodeRef.node.prevSibling?.type.id === relTerms.LhsId &&
            nodeContent(relCode, nodeRef.node.prevSibling) === 'output'
          ) {
            /* Get all relname literals inside an expression
             * when assigned to `output` e.g:
             * def output = { :test, :test2 ; :test3, :test4 }
             *                ^^^^^  ^^^^^^   ^^^^^^  ^^^^^^
             */
            const exprNodeContent = nodeContent(relCode, nodeRef.node);

            nodeRef.node.toTree().iterate({
              enter: (exprNodeRef: SyntaxNodeRef) => {
                if (exprNodeRef.type.id === relTerms.RelnameLiteral) {
                  groups.push(nodeContent(exprNodeContent, exprNodeRef.node));
                }
              },
            });
          }

          // Leave expression nodes to reduce iterations
          return false;
        }
      },
    });
  }

  return groups;
}
