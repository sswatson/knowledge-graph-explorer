import { set } from 'lodash-es';

import {
  ArrowRelation,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';

const SYMBOL_PREFIX = ':';
const ARRAY_MARKER = '[]';
const ARRAY_SYMBOL = SYMBOL_PREFIX + ARRAY_MARKER;

export function toObject(output: ArrowRelation[]): any {
  if (!output.length) {
    return {};
  }

  const results = output
    .map(r => new ResultTable(r))
    .filter(r => r.columnLength);

  // scalar value shortcut
  if (results.length === 1 && results[0].typeDefs()[0].type !== 'Constant') {
    return results[0].get(0)?.[0];
  }

  const rootArrayNumber = results.reduce((memo, table) => {
    const firstTypeDef = table.typeDefs()[0];

    if (
      firstTypeDef.type === 'Constant' &&
      firstTypeDef.value.value === ARRAY_SYMBOL
    ) {
      return memo + 1;
    }

    return memo;
  }, 0);

  if (rootArrayNumber > 0 && rootArrayNumber < output.length) {
    throw new Error('Inconsistent root array relations.');
  }

  const result = rootArrayNumber === 0 ? {} : [];

  try {
    results.forEach(resultTable => {
      if (resultTable.columnLength === 0) {
        return;
      }

      const typeDefs = resultTable.typeDefs();

      resultTable.values().forEach((row, rowIndex) => {
        let propPath: any[] = [];

        for (let i = 0; i < row.length - 1; i++) {
          const typeDef = typeDefs[i];
          const prevTypeDef = typeDefs[i - 1];

          if (
            prevTypeDef &&
            prevTypeDef.type === 'Constant' &&
            prevTypeDef.value.value === ARRAY_SYMBOL &&
            typeDef.type !== 'Constant'
          ) {
            const val = row[i];

            if (typeof val === 'bigint') {
              propPath[propPath.length - 1] = Number(val) - 1;
            } else if (typeof val === 'number') {
              propPath[propPath.length - 1] = val - 1;
            } else {
              // in case of non number index
              // we just use the row index
              propPath[propPath.length - 1] = rowIndex;
            }
          } else if (
            typeDef.type === 'Constant' &&
            typeDef.value.type === 'String'
          ) {
            propPath.push(typeDef.value.value.slice(1));
          } else {
            propPath.push(row[i]);
          }
        }

        const lastTypeDef = typeDefs[typeDefs.length - 1];
        let value = row[row.length - 1];

        if (
          lastTypeDef.type === 'Missing' &&
          propPath[propPath.length - 1] === ARRAY_MARKER
        ) {
          propPath = propPath.slice(0, -1);
          value = [];
        }

        if (
          lastTypeDef.type === 'Constant' &&
          lastTypeDef.value.type === 'String'
        ) {
          set(result, [...propPath, lastTypeDef.value.value.slice(1)], {});
        } else {
          set(result, propPath, value);
        }
      });
    });
  } catch {
    throw new Error(`Invalid JSON relation schema.`);
  }

  return result;
}
