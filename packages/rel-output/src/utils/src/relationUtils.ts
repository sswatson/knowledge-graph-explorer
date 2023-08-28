import { tableFromArrays } from 'apache-arrow';
import { get, set, sortBy } from 'lodash-es';

import {
  ArrowRelation,
  RelationId,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';

import { TextFile } from './fileUtils';

export function trimRel(code: string) {
  const whitespaceRegex = /^\s*$/;
  const beginWhitespaceRegex = /^(\s*)/;
  let lines = code.split('\n');

  if (whitespaceRegex.test(lines[0])) {
    lines = lines.slice(1);
  }

  if (whitespaceRegex.test(lines[lines.length - 1])) {
    lines = lines.slice(0, -1);
  }

  if (lines[0]) {
    const match = lines[0].match(beginWhitespaceRegex);
    const whitespaceLen = match && match[1] ? match[1].length : 0;

    lines = lines.map(l => l.slice(whitespaceLen));
  }

  return lines.join('\n');
}

export function sanitizeRelationName(name: string) {
  return name.replace(/[^\wΑ-Ωα-ω]/g, '').replace(/^\d*/, '');
}

export function makeUploadQuery(relationName: string, file: TextFile) {
  const inputName = `${relationName}_file`;

  let queryString = `
      def delete:${relationName} = ${relationName}
      def insert:${relationName} = ${inputName}
    `;

  if (file.name.endsWith('.json')) {
    queryString = `
        def config:data = ${inputName}
        def parsed_json = load_json[config]
        def delete:${relationName} = ${relationName}
        def insert:${relationName} = parsed_json
      `;
  }

  return {
    queryString,
    queryInput: {
      name: inputName,
      value: file.content,
    },
  };
}

export function filterResults(results: ResultTable[], keys: string[]) {
  const filteredResults: ResultTable[] = [];

  results.forEach(r => {
    const typeDefs = r.typeDefs();

    const match = keys.every((k, index) => {
      const typeDef = typeDefs[index];

      if (typeDef) {
        return typeDef.type === 'Constant'
          ? typeDef.value.value === k
          : typeDef.type === k;
      }
    });

    if (match) {
      filteredResults.push(r);
    }
  });

  return filteredResults;
}

type Value = string | boolean | number | BigInt | null | Value[];

export type PlainRelation<T = Value> = {
  relationId: string;
  columns: T[][];
  metadata?: RelationId;
};

// TODO move into a test utils package
// NOTE: this should be used only in tests
export function plainToArrow(plainRelations: PlainRelation[]) {
  return plainRelations.map(plainRelation => {
    const { relationId, columns, metadata } = plainRelation;
    const plainTable: { [c: string]: Value[] } = {};

    columns.forEach((col, index) => {
      plainTable[`v${index + 1}`] = col;
    });

    const relation: ArrowRelation = {
      relationId,
      table: tableFromArrays(plainTable),
      metadata: metadata || mockMetadata(relationId),
    };

    return relation;
  });
}

function mockMetadata(relationId: string) {
  const types = relationId.split('/').filter(t => !!t);

  const args: any[] = types.map(type => {
    if (type.startsWith(':')) {
      return {
        tag: 'CONSTANT_TYPE',
        constantType: {
          relType: {
            tag: 'PRIMITIVE_TYPE',
            primitiveType: 'STRING',
          },
          value: {
            arguments: [
              {
                tag: 'STRING',
                stringVal: Buffer.from(type.slice(1)).toString('base64'),
              },
            ],
          },
        },
      };
    }

    switch (type) {
      case 'Missing':
        return {
          tag: 'VALUE_TYPE',
          valueType: {
            argumentTypes: [
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'cmVs',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'YmFzZQ==',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'TWlzc2luZw==',
                      },
                    ],
                  },
                },
              },
            ],
          },
        };
      case 'Dates.DateTime':
        return {
          tag: 'VALUE_TYPE',
          valueType: {
            argumentTypes: [
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'cmVs',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'YmFzZQ==',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'RGF0ZVRpbWU=',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'PRIMITIVE_TYPE',
                primitiveType: 'INT_64',
              },
            ],
          },
        };
      case 'HashValue':
        return {
          tag: 'VALUE_TYPE',
          valueType: {
            argumentTypes: [
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'cmVs',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'YmFzZQ==',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'CONSTANT_TYPE',
                constantType: {
                  relType: {
                    tag: 'PRIMITIVE_TYPE',
                    primitiveType: 'STRING',
                  },
                  value: {
                    arguments: [
                      {
                        tag: 'STRING',
                        stringVal: 'SGFzaA==',
                      },
                    ],
                  },
                },
              },
              {
                tag: 'PRIMITIVE_TYPE',
                primitiveType: 'UINT_128',
              },
            ],
          },
        };
      case 'Bool':
        return {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'BOOL',
        };
      case 'String':
        return {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'STRING',
        };
      case 'Char':
        return {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'CHAR',
        };
      case 'Int32':
        return {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'INT_32',
        };
      case 'Int64':
        return {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'INT_64',
        };
      case 'Int128':
        return {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'INT_128',
        };
      case 'Float64':
        return {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'FLOAT_64',
        };
    }

    throw new Error(
      `Unknown type "${type}" when mocking Protobuf metadata in tests.`,
    );
  });

  return RelationId.fromJson({ arguments: args });
}

export type Pos = {
  line: number;
  character: number;
};

export type Range = {
  start: Pos;
  end: Pos;
};

export type Diagnostic = {
  code: string;
  message: string;
  severity: 'exception' | 'error' | 'warning' | 'info' | 'suggestion';
  report?: string;
  range?: Range[];
  model?: string;
};

export function parseDiagnostics(relations: ArrowRelation[]) {
  const results = relations.map(r => new ResultTable(r));
  const prefix = [':rel', ':catalog', ':diagnostic'];
  let diagnostics: Diagnostic[] = [];

  setRangeProp(
    ['start', 'line'],
    diagnostics,
    filterResults(results, [...prefix, ':range', ':start', ':line'])[0],
  );
  setRangeProp(
    ['start', 'character'],
    diagnostics,
    filterResults(results, [...prefix, ':range', ':start', ':character'])[0],
  );
  setRangeProp(
    ['end', 'line'],
    diagnostics,
    filterResults(results, [...prefix, ':range', ':end', ':line'])[0],
  );
  setRangeProp(
    ['end', 'character'],
    diagnostics,
    filterResults(results, [...prefix, ':range', ':end', ':character'])[0],
  );
  setProp(
    'message',
    diagnostics,
    filterResults(results, [...prefix, ':message'])[0],
  );
  setProp(
    'severity',
    diagnostics,
    filterResults(results, [...prefix, ':severity'])[0],
  );
  setProp('code', diagnostics, filterResults(results, [...prefix, ':code'])[0]);
  setProp(
    'report',
    diagnostics,
    filterResults(results, [...prefix, ':report'])[0],
  );
  setProp(
    'model',
    diagnostics,
    filterResults(results, [...prefix, ':model'])[0],
  );

  // filtering out undefined's
  // if there were gaps between diagnostic indices
  diagnostics = diagnostics.filter(d => !!d);

  return sortBy(diagnostics, 'range[0].start.line', 'range[0].start.character');
}

function setRangeProp(
  path: string[],
  result: Diagnostic[],
  resultTable: ResultTable,
) {
  if (resultTable) {
    const rows = resultTable.physical().values();

    rows.forEach(row => {
      const diagnosticIndex = Number(row[0]) - 1;
      const rangeIndex = Number(row[1]) - 1;
      const value = typeof row[2] === 'bigint' ? Number(row[2]) : row[2];

      set(result, [diagnosticIndex, 'range', rangeIndex, ...path], value);
    });
  }
}

function setProp(path: string, result: Diagnostic[], resultTable: ResultTable) {
  if (resultTable) {
    const rows = resultTable.physical().values();

    rows.forEach(row => {
      const diagnosticIndex = Number(row[0]) - 1;
      const value = typeof row[1] === 'bigint' ? Number(row[1]) : row[1];

      set(result, [diagnosticIndex, path], value);
    });
  }
}

export type IcViolation = {
  decl_id: string;
  name?: string;
  report: string;
  model?: string;
  range?: Range;
  output: ResultTable[];
};

export function parseIcViolations(relations: ArrowRelation[]) {
  const prefix = [':rel', ':catalog', ':ic_violation'];
  const results = filterResults(
    relations.map(r => new ResultTable(r)),
    prefix,
  ).map(r => r.sliceColumns(3));
  const violationsMap: Record<string, IcViolation> = {};

  results.forEach(resultTable => {
    const typeDef = resultTable.typeDefs()[0];
    const firstSymbol =
      typeDef?.type === 'Constant' &&
      typeDef.value.type === 'String' &&
      typeDef.value.value;

    // all relations below are starting with /:rel/:catalog/:ic_violation/...
    switch (firstSymbol) {
      // /:decl_id/HashValue/:DECL_ID
      case ':decl_id':
        setIcProp(resultTable, 'decl_id', violationsMap);
        break;
      // /:name/HashValue/:NAME
      case ':name':
        setIcProp(resultTable, 'name', violationsMap);
        break;
      // /:report/HashValue/String
      case ':report':
        setIcProp(resultTable, 'report', violationsMap);
        break;
      // /:model/HashValue/String
      case ':model':
        setIcProp(resultTable, 'model', violationsMap);
        break;
      // /:range/:end/:character/HashValue/Int64
      // /:range/:end/:line/HashValue/Int64
      // /:range/:start/:character/HashValue/Int64
      // /:range/:start/:line/HashValue/Int64
      case ':range':
        setIcRangeProp(resultTable, violationsMap);
        break;
      // /:output/HashValue/ANYTHING_HERE
      case ':output':
        setIcOutputProp(resultTable, violationsMap);
        break;
    }
  });

  const violations = Object.values(violationsMap).map(ic => {
    return {
      ...ic,
      output: ic.output ?? [],
    };
  });

  return sortBy(violations, 'range.start.line', 'range.start.character');
}

function setIcProp(resultTable: ResultTable, prop: string, obj: any) {
  resultTable.values().forEach(row => {
    const [, hash, propValue] = row;

    set(obj, [(hash as bigint).toString(), prop], propValue);
  });
}

function setIcRangeProp(resultTable: ResultTable, obj: any) {
  resultTable.values().forEach(row => {
    const [, _startOrEnd, _characterOrLine, hash, _value] = row;
    const startOrEnd = (_startOrEnd as string).slice(1); // getting rid of ":"
    const characterOrLine = (_characterOrLine as string).slice(1);
    const value = Number(_value);

    set(
      obj,
      [(hash as bigint).toString(), 'range', startOrEnd, characterOrLine],
      value,
    );
  });
}

function setIcOutputProp(resultTable: ResultTable, obj: any) {
  let lastStart = 0;
  const hashes = resultTable.columnAt(1).values();

  for (let i = 0; i < hashes.length; i++) {
    const hash = hashes[i] as bigint;
    const nextHash = hashes[i + 1] as bigint;

    if (hash !== nextHash) {
      const newTable = resultTable.sliceColumns(2).slice(lastStart, i + 1);
      const path = [hash.toString(), 'output'];
      const existingValue = get(obj, path, []);
      const newValue = [...existingValue, newTable];

      set(obj, path, newValue);
      lastStart = i + 1;
    }
  }
}

export function filterOutput(relations: ArrowRelation[]) {
  return relations
    .filter(r => r.relationId.startsWith('/:output'))
    .map(r => {
      const keys = r.relationId.split('/').filter(k => k);

      const relation: ArrowRelation = {
        relationId: `/${keys.slice(1).join('/')}`,
        table: r.table,
        metadata: {
          arguments: r.metadata.arguments.slice(1),
        },
      };

      return relation;
    });
}

export function readResults(relations: ArrowRelation[]) {
  return {
    output: filterOutput(relations),
    diagnostics: parseDiagnostics(relations),
  };
}
