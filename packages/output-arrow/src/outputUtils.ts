import {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import Decimal from 'decimal.js';
import {
  cloneDeepWith,
  flatten,
  mapValues,
  merge,
  times,
  union,
} from 'lodash-es';

import {
  ArrowRelation,
  getDisplayName,
  getDisplayValue,
  RelTypeDef,
  RelTypedValue,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';

import { MAIN_OUTPUT } from './constants';

// We store cell data as an object with 'value' and a 'typeDef' keys
// We do this we need to know how to format each cell differently based on type
type Cell = {
  // RelBool is a Console concept to display true relation
  typeDef: RelTypeDef | { type: 'RelBool' };
  value: RelTypedValue['value'];
};

function valueGetter(params: ValueGetterParams) {
  if (params.colDef.field) {
    const data = params.data[params.colDef.field];

    if (data) {
      return data.value;
    }
  }
}

function valueFormatter(params: ValueFormatterParams) {
  if (params.colDef.field) {
    const data = params.data[params.colDef.field] as Cell;

    if (data?.typeDef) {
      if (data.typeDef.type === 'RelBool') {
        return data.value ? '()' : '{}';
      }

      if (data.typeDef.type === 'String' || data.typeDef.type === 'Char') {
        return data.value?.toString() ?? '';
      }

      return getDisplayValue(data.typeDef, data.value);
    }
  }

  return '';
}

function resultTableToCells(table: ResultTable) {
  const typeDefs = table.typeDefs();

  return table.values().map(row => {
    return row.map((value, index) => {
      const cell: Cell = {
        typeDef: typeDefs[index],
        value,
      };

      return cell;
    });
  });
}

export const RELATION_SIZE_THRESHOLD = 50000;

export function checkThreshold(relations: ArrowRelation[]) {
  const errors: string[] = [];

  for (const rel of relations) {
    if (rel.table.numRows > RELATION_SIZE_THRESHOLD) {
      errors.push(
        `"${rel.relationId}" relation exceeded the threshold of ${RELATION_SIZE_THRESHOLD} tuples`,
      );
    }
  }

  return errors;
}

export function getMimeType(relations: ArrowRelation[]) {
  const resultTables = relations.map(r => new ResultTable(r));
  const mimeTable = resultTables.find(t => {
    const col = !!t.columnLength && t.columnAt(0);

    return (
      col &&
      col.typeDef.type === 'Constant' &&
      col.typeDef.value.value === ':MIME'
    );
  });

  if (mimeTable) {
    const row = mimeTable.get(0);

    if (row) {
      return row[1] as string;
    }
  }
}

export function collectValues<T>(relPath: string, relations: ArrowRelation[]) {
  return flatten(
    relations
      .filter(r => r.relationId.startsWith(relPath))
      .map(r => {
        const table = new ResultTable(r);
        const lastColumnIndex = table.columnLength - 1;
        const column = table.columnAt(lastColumnIndex);

        return column.values() as T[];
      }),
  );
}

export function toPhysicalColumns(relation: ArrowRelation) {
  const table = new ResultTable(relation).physical();
  const typeDefs = table.columns().map(c => c.typeDef);

  // true relation corner case
  if (table.columnLength === 0 && table.length === 0) {
    return [
      {
        field: '0',
        headerName: ' ',
        sortable: true,
        resizable: true,
        valueGetter: valueGetter,
        valueFormatter: valueFormatter,
      },
    ];
  }

  const columns: ColDef[] = typeDefs.map((typeDef, index) => {
    return {
      field: index.toString(),
      headerName: getDisplayName(typeDef),
      sortable: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      valueGetter: valueGetter,
      valueFormatter: valueFormatter,
    };
  });

  return columns;
}

export function toPhysicalRows(relation: ArrowRelation) {
  const table = new ResultTable(relation).physical();

  // true relation corner case
  if (table.columnLength === 0 && table.length === 0) {
    const cell: Cell = { typeDef: { type: 'RelBool' }, value: true };

    return [[cell]];
  }

  return resultTableToCells(table);
}

export function toLogicalColumns(relations: (ArrowRelation | ResultTable)[]) {
  return relations.reduce(
    (result: ColDef[], relation: ArrowRelation | ResultTable) => {
      const table =
        relation instanceof ResultTable ? relation : new ResultTable(relation);
      const columnTypes = table.typeDefs() as Cell['typeDef'][];

      // true relation corner case
      if (table.columnLength === 0 && table.length === 0) {
        columnTypes.push({
          type: 'RelBool',
        });
      }

      columnTypes.forEach((typeDef, index) => {
        const prevHeader = index < result.length && result[index]?.headerName;
        const colName =
          typeDef.type === 'Constant' && typeDef.value.type === 'String'
            ? 'Symbol'
            : typeDef.type === 'RelBool'
            ? typeDef.type
            : getDisplayName(typeDef);

        let headerName;

        if (prevHeader) {
          headerName = colName === prevHeader ? prevHeader : 'Mixed';
        } else {
          headerName = colName;
        }

        result[index] = {
          headerName: headerName,
          field: index.toString(),
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueGetter: valueGetter,
          valueFormatter: valueFormatter,
        };
      });

      return result;
    },
    [],
  );
}

export function toLogicalRows(relation: ArrowRelation | ResultTable) {
  const table =
    relation instanceof ResultTable ? relation : new ResultTable(relation);

  // true relation corner case
  if (table.columnLength === 0 && table.length === 0) {
    const cell: Cell = { typeDef: { type: 'RelBool' }, value: true };

    return [[cell]];
  }

  return resultTableToCells(table);
}

function parseTableData(relations: ArrowRelation[]) {
  const errors: { message: string }[] = [];

  const data = relations
    .filter(r => r.relationId.startsWith('/:table/:data'))
    .map(r => {
      const table = new ResultTable(r);

      return table.sliceColumns(2);
    })
    .filter(table => {
      if (table.columnLength === 0) {
        errors.push({
          message: `Table display currently does not support arity-0 input relations.`,
        });

        return false;
      }

      if (table.columnLength === 1) {
        const rel = table
          .columns()
          .map(c => getDisplayName(c.typeDef))
          .join('/');

        errors.push({
          message: `Skipping Relation /${rel}: table display currently does not support arity-1 input relations.`,
        });

        return false;
      }

      return true;
    });

  if (data.length === 0) {
    errors.push({
      message: `No data to display.`,
    });
  }

  return {
    errors,
    data,
  };
}

export function getTableData(relations: ArrowRelation[]) {
  const { data, errors } = parseTableData(relations);

  if (errors.length > 0) {
    return {
      errors,
      rows: [],
      columns: [],
    };
  }

  return {
    errors,
    rows: getTableRows(data),
    columns: getTableColumns(data),
  };
}

function getTableRows(resultTables: ResultTable[]) {
  type Results = {
    [key: string]: object;
  };
  const results: Results = {};

  resultTables.forEach(table => {
    const tuples = table.values();
    const typeDefs = table.typeDefs();

    // We store cell data as an object with 'value' and a 'type' keys
    // which we later use to do formatting of values for a cell
    tuples.map(tuple => {
      const columnKey = `column-key-${tuple[0]}`;
      const rowHeaderValues =
        tuple.length > 2 ? tuple.slice(1, -1) : tuple.slice(-1);

      const rowHeaderKey = rowHeaderValues.reduce<Record<string, Cell>>(
        (prev, curr, i) => {
          return {
            ...prev,
            [`row-header-${i}`]: {
              typeDef: typeDefs[i + 1],
              value: curr,
            },
          };
        },
        {},
      );

      const stringKey = Object.keys(rowHeaderKey)
        .map(
          k =>
            `${k}: ${getDisplayValue(
              rowHeaderKey[k].typeDef as RelTypeDef,
              rowHeaderKey[k].value,
            )}`,
        )
        .join('|');
      const valueIndex = tuple.length - 1;
      // If there is no value, i.e. the relation only has 2 keys, then we treat
      // it like a set the value is a boolean to indicate there is a value at
      // that intersection
      const hasValue = tuple.length > 2;
      const valueTypeDef = typeDefs[valueIndex];

      results[stringKey] = merge(results[stringKey], {
        ...rowHeaderKey,
        [columnKey]: {
          typeDef: hasValue ? valueTypeDef : { type: 'Bool' },
          value: hasValue ? tuple[valueIndex] : true,
        },
      });
    });
  });

  return Object.keys(results).map(key => {
    return {
      ...results[key],
    };
  });
}

function getTableColumns(resultTables: ResultTable[]) {
  // For each unique value in the first column of a relation, we create
  // a table column
  const uniqueHeaderValues = union(
    ...resultTables.map(t => t.columnAt(0).values()),
  );

  // The first column of a relation determines the column header and the last
  // column of the relation is the value column. Typically relations have the
  // same number of keys. Sometimes though, relations will have different
  // numbers of keys. We compute the maximum tuple size in order to know how
  // many row headers we need.
  const maxKeys = resultTables.reduce(
    (max, t) => (max > t.columnLength ? max : t.columnLength),
    0,
  );

  const headerColumns: ColDef[] = Array.from(uniqueHeaderValues).map(header => {
    return {
      headerName: `${header}`,
      field: `column-key-${header}`,
      sortable: true,
      resizable: true,
      valueGetter: valueGetter,
      valueFormatter: valueFormatter,
    };
  });

  const rowHeaderColumns: ColDef[] = times(maxKeys - 2, i => {
    return {
      headerName: '',
      field: `row-header-${i}`,
      sortable: true,
      resizable: true,
      cellClass: ['bg-gray-100'],
      valueGetter: valueGetter,
      valueFormatter: valueFormatter,
    };
  });

  return rowHeaderColumns.concat(headerColumns);
}

export function toJson(obj: any): any {
  // converting BigInt and decimal.js to number
  // losing precision is expected
  return cloneDeepWith(obj, value => {
    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (Decimal.isDecimal(value)) {
      return value.toNumber();
    }
  });
}

export function toRawColumns(relation: ArrowRelation) {
  const arrowTable = relation.table;

  const columns: ColDef[] = arrowTable.schema.names.map(name => ({
    field: name.toString(),
    headerName: name.toString(),
    sortable: true,
    resizable: true,
    wrapText: true,
    autoHeight: true,
    valueFormatter: params => {
      if (params.colDef.field) {
        const data = params.data[params.colDef.field];

        if (data) {
          return formatRawValue(data);
        }
      }

      return '';
    },
  }));

  return columns;
}

export function toRawRows(relation: ArrowRelation) {
  const arrowTable = relation.table;

  return arrowTable.toArray().map(arrowRow => {
    return mapValues(arrowRow.toJSON(), v => unpackArrow(v));
  });
}

// Arrow has a bunch of wrappers around that like StructRow, Proxy<T>, Vector and etc
// because of that AgGrid throw an error sometimes
// so we "unpack" it to plain JS objects
function unpackArrow(value: any): any {
  if (value.toArray) {
    return Array.from(value.toArray()).map(unpackArrow);
  }

  return value;
}

function formatRawValue(value: any | any[]): string {
  if (Array.isArray(value)) {
    const values = value.map(v => formatRawValue(v));

    return `(${values.join(', ')})`;
  }

  return value.toString();
}

export function groupRelations(relations: ArrowRelation[]) {
  const result: Record<string, ArrowRelation[]> = {
    [MAIN_OUTPUT]: [],
  };

  relations.forEach(relation => {
    const resultTable = new ResultTable(relation);
    const typeDef = resultTable.typeDefs()[0];

    const group =
      typeDef && typeDef.type === 'Constant' && typeDef.value.type === 'String'
        ? typeDef?.value?.value
        : MAIN_OUTPUT;

    let newRelation: ArrowRelation;

    if (group === MAIN_OUTPUT) {
      newRelation = relation;
    } else {
      // TODO get rid of relationId manipulation
      newRelation = {
        relationId: relation.relationId.replace(`/${group}/`, '/'),
        table: relation.table,
        metadata: {
          arguments: relation.metadata.arguments.slice(1),
        },
      };
    }

    if (result[group]) {
      result[group].push(newRelation);
    } else {
      result[group] = [newRelation];
    }
  });

  return result;
}
