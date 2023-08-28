import {
  CONSTRAINT_STATEMENTS,
  DECLARATION_STATEMENTS,
  getDeclarationNode,
  nodeContent,
  relLanguage,
  relTerms,
  SyntaxNodeRef,
  Text,
} from '@relationalai/code-editor';
import { Idb } from '@relationalai/utils';

import {
  ModelReference,
  ModuleDefinition,
  ReferenceInfo,
  RelationDefinition,
  RelDefinition,
  WorksheetReference,
} from '../types';

function defToIdb(def: RelDefinition): Idb | undefined {
  if (
    !['relation', 'operandRelation', 'module', 'constraint'].includes(
      def.type,
    ) ||
    def.reference.type !== 'model'
  ) {
    return undefined;
  }

  return {
    name: def.name,
    pos: {
      from: def.reference.from,
      to: def.reference.to,
      line: def.reference.line,
      column: def.reference.column,
    },
    children:
      def.type === 'module'
        ? def.children
            .map(defToIdb)
            .filter((idb): idb is Idb => idb !== undefined)
        : [],
    modelName: def.reference.name,
    type: def.type,
  };
}

export function defsToIdbsByModel(
  definitions: RelDefinition[],
): Map<string, Idb[]> {
  const allIdbs = new Map<string, Idb[]>();

  definitions.forEach(def => {
    if (def.reference.type === 'model') {
      const prevIdbs = allIdbs.get(def.reference.name) ?? [];
      const newIdb: Idb | undefined = defToIdb(def);

      if (newIdb) {
        prevIdbs.push(newIdb);
        allIdbs.set(def.reference.name, prevIdbs);
      }
    }
  });

  return allIdbs;
}

function getRelation(
  nodeRef: SyntaxNodeRef,
  nodeContent: string,
  reference: ModelReference | WorksheetReference,
): RelationDefinition | null {
  const nodeTypeId = nodeRef.type.id;
  const parentTypeId = nodeRef.node.parent?.type.id;
  const declarationNodeTypeId = getDeclarationNode(nodeRef.node)?.type.id;

  if (!declarationNodeTypeId) {
    return null;
  }

  if (parentTypeId === relTerms.LhsId) {
    return {
      name: nodeContent,
      type: CONSTRAINT_STATEMENTS.includes(declarationNodeTypeId)
        ? 'constraint'
        : nodeTypeId === relTerms.ParenOpId
        ? 'operandRelation'
        : 'relation',
      reference,
    };
  }

  return null;
}

function getConstructor(
  nodeRef: SyntaxNodeRef,
  nodeContent: string,
  reference: ModelReference | WorksheetReference,
): RelationDefinition | null {
  const nodeTypeId = nodeRef.type.id;
  const declarationNodeTypeId = getDeclarationNode(nodeRef.node)?.type.id;

  if (
    (declarationNodeTypeId === relTerms.ValueTypeStatement ||
      declarationNodeTypeId === relTerms.EntityTypeStatement) &&
    nodeTypeId === relTerms.LhsId
  ) {
    const name = `^${nodeContent}`;

    return {
      name,
      type: 'constructor',
      reference,
    };
  }

  return null;
}

export function getRelDefinitions(
  relCode: string,
  refInfo: ReferenceInfo,
): RelDefinition[] {
  const relDefinitions: RelDefinition[] = [];
  const modules: ModuleDefinition[] = [];

  if (relCode) {
    const codeText = Text.of(relCode.split('\n'));

    relLanguage.parser.parse(relCode).iterate({
      enter: (nodeRef: SyntaxNodeRef) => {
        const nodeTypeId = nodeRef.type.id;
        const parentTypeId = nodeRef.node.parent?.type.id;
        const { node, from, to } = nodeRef;
        const { number: line, from: lineFrom } = codeText.lineAt(from);
        const column = from - lineFrom;

        // Leave node if it's a right side expression
        if (nodeTypeId === relTerms.Expression) {
          return false;
        }

        // continue if it's a declaration statement
        if (DECLARATION_STATEMENTS.includes(nodeTypeId)) {
          return true;
        }

        const content = nodeContent(relCode, node);
        const reference = {
          ...refInfo,
          from,
          to,
          line,
          column,
        };

        const parentModule = modules[modules.length - 1];

        if (
          parentTypeId === relTerms.ModuleStatement &&
          nodeTypeId === relTerms.LhsId
        ) {
          const moduleDefinition = {
            name: content,
            type: 'module' as const,
            reference,
            children: [],
          };

          if (parentModule) {
            parentModule.children.push(moduleDefinition);
          } else {
            relDefinitions.push(moduleDefinition);
          }

          modules.push(moduleDefinition);

          return false;
        }

        const callbacks = [getRelation, getConstructor];

        callbacks.forEach(callback => {
          const result = callback(nodeRef, content, reference);

          if (result && parentModule) {
            parentModule.children.push(result);
          } else if (result) {
            relDefinitions.push(result);
          }
        });
      },
      leave: (nodeRef: SyntaxNodeRef) => {
        const nodeTypeId = nodeRef.type.id;

        if (nodeTypeId === relTerms.ModuleStatement) {
          modules.pop();
        }
      },
    });
  }

  return relDefinitions;
}
