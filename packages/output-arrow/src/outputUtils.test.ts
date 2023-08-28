import Decimal from 'decimal.js';

import {
  ArrowRelation,
  RelationId,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';
import { plainToArrow } from '@relationalai/utils';

import {
  checkThreshold,
  collectValues,
  getMimeType,
  getTableData,
  groupRelations,
  RELATION_SIZE_THRESHOLD,
  toJson,
  toLogicalColumns,
  toLogicalRows,
  toPhysicalColumns,
  toPhysicalRows,
  toRawColumns,
  toRawRows,
} from './outputUtils';

function makeSymbolDef(sym: string) {
  return {
    type: 'Constant',
    value: {
      type: 'String',
      value: sym,
    },
  };
}

describe('outputUtils', () => {
  it('should check rows threshold', () => {
    const relations1 = plainToArrow([
      {
        relationId: '/:baz/Int64',
        columns: [
          Array.from<number>({ length: RELATION_SIZE_THRESHOLD + 2 }).fill(2),
        ],
      },
      { relationId: '/:foo/Int64', columns: [[1, 2]] },
      {
        relationId: '/:bar/Int64',
        columns: [
          Array.from<number>({ length: RELATION_SIZE_THRESHOLD + 1 }).fill(1),
        ],
      },
    ]);
    const relations2 = plainToArrow([
      { relationId: '/:foo/Int64', columns: [[1, 2]] },
      {
        relationId: '/:bar/Int64',
        columns: [
          Array.from<number>({ length: RELATION_SIZE_THRESHOLD - 1 }).fill(1),
        ],
      },
    ]);

    expect(checkThreshold(relations1)).toHaveLength(2);
    expect(checkThreshold(relations1)[0]).toContain('/:baz/Int64');
    expect(checkThreshold(relations1)[1]).toContain('/:bar/Int64');
    expect(checkThreshold(relations2)).toEqual([]);
  });

  it('should get mime type', () => {
    const relations = plainToArrow([
      { relationId: '/:json/:data/:foo/Int64', columns: [[1, 2]] },
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.json']],
      },
      {
        relationId: '/',
        columns: [],
      },
    ]);

    expect(getMimeType(relations)).toEqual('application/vnd.rel.relation.json');
    expect(getMimeType([relations[0]])).toBeUndefined();
  });

  it('should handle true relation when getting mime type', () => {
    const relations = plainToArrow([
      {
        relationId: '/',
        columns: [],
      },
    ]);

    expect(getMimeType(relations)).toBeUndefined();
  });

  it('should collect values', () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int64/:bar/String',
        columns: [
          [1, 2],
          ['a', 'b'],
        ],
      },
      { relationId: '/:foo/Int64/', columns: [[3, 4]] },
    ]);

    expect(collectValues('/:foo/Int64/', relations)).toEqual(['a', 'b', 3, 4]);
  });

  describe('physical mode', () => {
    it('should get physical columns', () => {
      const relations = plainToArrow([
        {
          relationId: '/:foo/Int64/:bar/String',
          columns: [
            [1, 2],
            ['a', 'b'],
          ],
        },
      ]);
      const columns = toPhysicalColumns(relations[0]);

      expect(columns).toEqual([
        {
          field: '0',
          headerName: 'Int64',
          sortable: true,
          resizable: true,
          autoHeight: true,
          wrapText: true,
          valueGetter: expect.anything(),
          valueFormatter: expect.anything(),
        },
        {
          field: '1',
          headerName: 'String',
          sortable: true,
          resizable: true,
          autoHeight: true,
          wrapText: true,
          valueGetter: expect.anything(),
          valueFormatter: expect.anything(),
        },
      ]);
    });

    it('should get physical columns for true relation', () => {
      const relations = plainToArrow([{ relationId: '/:foo', columns: [] }]);
      const columns = toPhysicalColumns(relations[0]);

      expect(columns).toEqual([
        {
          field: '0',
          headerName: ' ',
          sortable: true,
          resizable: true,
          valueGetter: expect.anything(),
          valueFormatter: expect.anything(),
        },
      ]);
    });

    it('should get physical rows', () => {
      const relations = plainToArrow([
        {
          relationId: '/:foo/Int32/:bar/String',
          columns: [
            [1, 2],
            ['a', 'b'],
          ],
        },
      ]);

      expect(toPhysicalRows(relations[0])).toEqual([
        [
          { typeDef: { type: 'Int32' }, value: 1 },
          { typeDef: { type: 'String' }, value: 'a' },
        ],
        [
          { typeDef: { type: 'Int32' }, value: 2 },
          { typeDef: { type: 'String' }, value: 'b' },
        ],
      ]);
    });

    it('should get physical rows for true relation', () => {
      const relations = plainToArrow([{ relationId: '/:foo', columns: [] }]);

      expect(toPhysicalRows(relations[0])).toEqual([
        [{ typeDef: { type: 'RelBool' }, value: true }],
      ]);
    });
  });

  describe('logical mode', () => {
    it('should get logical columns', () => {
      const relations = plainToArrow([
        {
          relationId: '/:foo/Int32/:bar/String',
          columns: [
            [1, 2],
            ['a', 'b'],
          ],
        },
        { relationId: '/Int32', columns: [[3]] },
      ]);
      const columns = toLogicalColumns(relations);

      expect(columns).toEqual([
        {
          field: '0',
          headerName: 'Mixed',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
        {
          field: '1',
          headerName: 'Int32',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
        {
          field: '2',
          headerName: 'Symbol',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
        {
          field: '3',
          headerName: 'String',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
      ]);
    });

    it('should get logical columns for true relation', () => {
      const relations = plainToArrow([{ relationId: '/', columns: [] }]);
      const columns = toLogicalColumns([relations[0]]);

      expect(columns).toEqual([
        {
          field: '0',
          headerName: 'RelBool',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
      ]);
    });

    it('should get logical columns for true relation mixed', () => {
      const relations = plainToArrow([
        { relationId: '/', columns: [] },
        { relationId: '/:foo/String', columns: [['a']] },
      ]);
      const columns = toLogicalColumns(relations);

      expect(columns).toEqual([
        {
          field: '0',
          headerName: 'Mixed',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
        {
          field: '1',
          headerName: 'String',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
      ]);
    });

    it('should get logical columns using result table as input', () => {
      const relations = plainToArrow([
        { relationId: '/', columns: [] },
        { relationId: '/:foo/String', columns: [['a']] },
      ]).map(r => new ResultTable(r));
      const columns = toLogicalColumns(relations);

      expect(columns).toEqual([
        {
          field: '0',
          headerName: 'Mixed',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
        {
          field: '1',
          headerName: 'String',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
      ]);
    });

    it('should get logical rows', () => {
      const relations = plainToArrow([
        {
          relationId: '/:foo/Int32/:bar/String',
          columns: [
            [1, 2],
            ['a', 'b'],
          ],
        },
      ]);

      expect(toLogicalRows(relations[0])).toEqual([
        [
          {
            typeDef: makeSymbolDef(':foo'),
            value: ':foo',
          },
          { typeDef: { type: 'Int32' }, value: 1 },
          {
            typeDef: makeSymbolDef(':bar'),
            value: ':bar',
          },
          { typeDef: { type: 'String' }, value: 'a' },
        ],
        [
          {
            typeDef: makeSymbolDef(':foo'),
            value: ':foo',
          },
          { typeDef: { type: 'Int32' }, value: 2 },
          {
            typeDef: makeSymbolDef(':bar'),
            value: ':bar',
          },
          { typeDef: { type: 'String' }, value: 'b' },
        ],
      ]);
    });

    it('should get logical rows for true relation', () => {
      const relations = plainToArrow([{ relationId: '/', columns: [] }]);

      expect(toLogicalRows(relations[0])).toEqual([
        [{ typeDef: { type: 'RelBool' }, value: true }],
      ]);
    });

    it('should get logical rows for fully specialized relation', () => {
      const relations = plainToArrow([
        { relationId: '/:foo/:bar/:baz', columns: [] },
      ]);

      expect(toLogicalRows(relations[0])).toEqual([
        [
          {
            typeDef: makeSymbolDef(':foo'),
            value: ':foo',
          },
          {
            typeDef: makeSymbolDef(':bar'),
            value: ':bar',
          },
          {
            typeDef: makeSymbolDef(':baz'),
            value: ':baz',
          },
        ],
      ]);
    });

    it('should get logical columns and logical rows for fully specialized relation', () => {
      const relations = plainToArrow([
        { relationId: '/:a/:b/', columns: [] },
        { relationId: '/:c/:d/', columns: [] },
      ]);

      const columns = toLogicalColumns(relations);

      expect(columns).toEqual([
        {
          field: '0',
          headerName: 'Symbol',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
        {
          field: '1',
          headerName: 'Symbol',
          sortable: true,
          resizable: true,
          wrapText: true,
          autoHeight: true,
          valueFormatter: expect.anything(),
          valueGetter: expect.anything(),
        },
      ]);

      expect(toLogicalRows(relations[0])).toEqual([
        [
          {
            typeDef: makeSymbolDef(':a'),
            value: ':a',
          },
          {
            typeDef: makeSymbolDef(':b'),
            value: ':b',
          },
        ],
      ]);

      expect(toLogicalRows(relations[1])).toEqual([
        [
          {
            typeDef: makeSymbolDef(':c'),
            value: ':c',
          },
          {
            typeDef: makeSymbolDef(':d'),
            value: ':d',
          },
        ],
      ]);
    });

    it('should get logical rows using result table as input', () => {
      const relations = plainToArrow([
        { relationId: '/:foo/String', columns: [['a']] },
      ]).map(r => new ResultTable(r));

      expect(toLogicalRows(relations[0])).toEqual([
        [
          {
            typeDef: makeSymbolDef(':foo'),
            value: ':foo',
          },
          {
            typeDef: { type: 'String' },
            value: 'a',
          },
        ],
      ]);
    });
  });

  describe('raw mode', () => {
    it('should get raw columns', () => {
      const relations = plainToArrow([
        {
          relationId: '/:foo/Int64/:bar/String',
          columns: [
            [1, 2],
            ['a', 'b'],
          ],
        },
      ]);
      const columns = toRawColumns(relations[0]);

      expect(columns).toEqual([
        {
          field: 'v1',
          headerName: 'v1',
          sortable: true,
          resizable: true,
          autoHeight: true,
          wrapText: true,
          valueFormatter: expect.anything(),
        },
        {
          field: 'v2',
          headerName: 'v2',
          sortable: true,
          resizable: true,
          autoHeight: true,
          wrapText: true,
          valueFormatter: expect.anything(),
        },
      ]);
    });

    it('should get raw rows', () => {
      const relations = plainToArrow([
        {
          relationId: '/:foo/Int32/:bar/String',
          columns: [
            [1, 2],
            ['a', 'b'],
          ],
        },
      ]);

      expect(toRawRows(relations[0])).toEqual([
        { v1: 1, v2: 'a' },
        { v1: 2, v2: 'b' },
      ]);
    });

    it('should get raw rows for nested values', () => {
      const relations = plainToArrow([
        {
          relationId: '/(:MyType, Int32, Int32)/:bar/String',
          columns: [
            [
              [1, 2],
              [3, 4],
            ],
            ['a', 'b'],
          ],
          metadata: RelationId.fromJson({
            arguments: [
              {
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
                              stringVal: 'TXlUeXBl',
                            },
                          ],
                        },
                      },
                    },
                    {
                      tag: 'PRIMITIVE_TYPE',
                      primitiveType: 'INT_32',
                    },
                    {
                      tag: 'PRIMITIVE_TYPE',
                      primitiveType: 'INT_32',
                    },
                  ],
                },
              },
            ],
          }),
        },
      ]);

      expect(toRawRows(relations[0])).toEqual([
        { v1: [1, 2], v2: 'a' },
        { v1: [3, 4], v2: 'b' },
      ]);
    });
  });

  describe('partitined mode', () => {
    it('should group relations by first symbol column', () => {
      const relations = plainToArrow([
        {
          relationId: '/Int32/Int32',
          columns: [
            [5, 10],
            [15, 20],
          ],
        },

        {
          relationId: '/:data/:a/Int32/Int32',
          columns: [
            [5, 10],
            [15, 20],
          ],
        },
        {
          relationId: '/:data/:b/Int32/Int32',
          columns: [
            [2, 4],
            [6, 8],
          ],
        },
        {
          relationId: '/:table/:data/:a/Int32/Int32',
          columns: [
            [1, 2],
            [2, 3],
          ],
        },
        {
          relationId: '/:table/:data/:b/Int32/Int32',
          columns: [
            [1, 2],
            [20, 30],
          ],
        },
        {
          relationId: '/',
          columns: [],
        },
      ]);

      const grouped = groupRelations(relations);

      expect(grouped['output'].map(r => r.relationId)).toEqual([
        '/Int32/Int32',
        '/',
      ]);
      expect(grouped[':data'].map(r => r.relationId)).toEqual([
        '/:a/Int32/Int32',
        '/:b/Int32/Int32',
      ]);
      expect(grouped[':table'].map(r => r.relationId)).toEqual([
        '/:data/:a/Int32/Int32',
        '/:data/:b/Int32/Int32',
      ]);
    });
  });

  describe('getTableData', () => {
    it('should produce a joined, materialized table from input column-relations', () => {
      const output = plainToArrow([
        {
          relationId: '/:table/:data/:a/Int32/Int32',
          columns: [
            [1, 2],
            [2, 3],
          ],
        },
        {
          relationId: '/:table/:data/:b/Int32/Int32',
          columns: [
            [1, 2],
            [20, 30],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { value: 1, typeDef: { type: 'Int32' } },
            'column-key-:a': { value: 2, typeDef: { type: 'Int32' } },
            'column-key-:b': { value: 20, typeDef: { type: 'Int32' } },
          },
          {
            'row-header-0': { value: 2, typeDef: { type: 'Int32' } },
            'column-key-:a': { value: 3, typeDef: { type: 'Int32' } },
            'column-key-:b': { value: 30, typeDef: { type: 'Int32' } },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':a',
            field: 'column-key-:a',
          },
          {
            headerName: ':b',
            field: 'column-key-:b',
          },
        ],
      });
    });

    it('should produce a joined, materialized table from input column-relations with BigInt', () => {
      const output: ArrowRelation[] = plainToArrow([
        {
          relationId: '/:table/:data/:a/Int64/Int64',
          columns: [
            [BigInt(1), BigInt(2)],
            [BigInt(2), BigInt(3)],
          ],
        },
        {
          relationId: '/:table/:data/:b/Int64/Int64',
          columns: [
            [BigInt(1), BigInt(2)],
            [BigInt(20), BigInt(30)],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { value: BigInt(1), typeDef: { type: 'Int64' } },
            'column-key-:a': { value: BigInt(2), typeDef: { type: 'Int64' } },
            'column-key-:b': { value: BigInt(20), typeDef: { type: 'Int64' } },
          },
          {
            'row-header-0': { value: BigInt(2), typeDef: { type: 'Int64' } },
            'column-key-:a': { value: BigInt(3), typeDef: { type: 'Int64' } },
            'column-key-:b': { value: BigInt(30), typeDef: { type: 'Int64' } },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':a',
            field: 'column-key-:a',
          },
          {
            headerName: ':b',
            field: 'column-key-:b',
          },
        ],
      });
    });

    it('should produce a valid table when input data has constants in values', () => {
      const output = plainToArrow([
        { relationId: '/:table/:data/:a/Int32/:x', columns: [[1, 2]] },
        { relationId: '/:table/:data/:b/Int32/:y', columns: [[1, 2]] },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { value: 1, typeDef: { type: 'Int32' } },
            'column-key-:a': {
              value: ':x',
              typeDef: makeSymbolDef(':x'),
            },
            'column-key-:b': {
              value: ':y',
              typeDef: makeSymbolDef(':y'),
            },
          },
          {
            'row-header-0': { value: 2, typeDef: { type: 'Int32' } },
            'column-key-:a': {
              value: ':x',
              typeDef: makeSymbolDef(':x'),
            },
            'column-key-:b': {
              value: ':y',
              typeDef: makeSymbolDef(':y'),
            },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':a',
            field: 'column-key-:a',
          },
          {
            headerName: ':b',
            field: 'column-key-:b',
          },
        ],
      });
    });

    it('should produce a valid table when input data is only symbols', () => {
      const output = plainToArrow([
        { relationId: '/:table/:data/:a/:i/:x', columns: [[]] },
        { relationId: '/:table/:data/:a/:j/:x2', columns: [[]] },
        { relationId: '/:table/:data/:b/:i/:y', columns: [[]] },
        { relationId: '/:table/:data/:b/:j/:y2', columns: [[]] },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': {
              value: ':i',
              typeDef: makeSymbolDef(':i'),
            },
            'column-key-:a': { value: ':x', typeDef: makeSymbolDef(':x') },
            'column-key-:b': { value: ':y', typeDef: makeSymbolDef(':y') },
          },
          {
            'row-header-0': { value: ':j', typeDef: makeSymbolDef(':j') },
            'column-key-:a': { value: ':x2', typeDef: makeSymbolDef(':x2') },
            'column-key-:b': { value: ':y2', typeDef: makeSymbolDef(':y2') },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':a',
            field: 'column-key-:a',
          },
          {
            headerName: ':b',
            field: 'column-key-:b',
          },
        ],
      });
    });

    it('should produce a valid table with sparse data', () => {
      const output = plainToArrow([
        { relationId: '/:table/:data/:a/Int32/:x', columns: [[1, 3]] },
        { relationId: '/:table/:data/:b/Int32/:y', columns: [[1, 2]] },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { value: 1, typeDef: { type: 'Int32' } },
            'column-key-:a': { value: ':x', typeDef: makeSymbolDef(':x') },
            'column-key-:b': { value: ':y', typeDef: makeSymbolDef(':y') },
          },
          {
            'row-header-0': { value: 3, typeDef: { type: 'Int32' } },
            'column-key-:a': { value: ':x', typeDef: makeSymbolDef(':x') },
          },
          {
            'row-header-0': { value: 2, typeDef: { type: 'Int32' } },
            'column-key-:b': { value: ':y', typeDef: makeSymbolDef(':y') },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':a',
            field: 'column-key-:a',
          },
          {
            headerName: ':b',
            field: 'column-key-:b',
          },
        ],
      });
    });

    it('should produce a heterogeneous table when input data has varying arities', () => {
      const output = plainToArrow([
        { relationId: '/:table/:data/:b/Int32/:y', columns: [[1, 2]] },
        {
          relationId: '/:table/:data/:b/Int32/Int32/Int32',
          columns: [[1], [1], [10]],
        },
        {
          relationId: '/:table/:data/:a/Int32/Int32',
          columns: [
            [1, 2],
            [3, 4],
          ],
        },
        {
          relationId: '/:table/:data/:a/Int32/Int32/Int32',
          columns: [[1], [1], [10]],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 1 },
            'column-key-:b': { typeDef: makeSymbolDef(':y'), value: ':y' },
            'column-key-:a': { typeDef: { type: 'Int32' }, value: 3 },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 2 },
            'column-key-:b': { typeDef: makeSymbolDef(':y'), value: ':y' },
            'column-key-:a': { typeDef: { type: 'Int32' }, value: 4 },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 1 },
            'row-header-1': { typeDef: { type: 'Int32' }, value: 1 },
            'column-key-:b': { typeDef: { type: 'Int32' }, value: 10 },
            'column-key-:a': { typeDef: { type: 'Int32' }, value: 10 },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: '',
            field: 'row-header-1',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':b',
            field: 'column-key-:b',
          },
          {
            headerName: ':a',
            field: 'column-key-:a',
          },
        ],
      });
    });

    it('should produce a table from arity-2 relation, with only "true" values', () => {
      const output = plainToArrow([
        {
          relationId: '/:table/:data/Int32/Int32',
          columns: [
            [1, 2, 3],
            [10, 20, 30],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 10 },
            'column-key-1': { typeDef: { type: 'Bool' }, value: true },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 20 },
            'column-key-2': { typeDef: { type: 'Bool' }, value: true },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 30 },
            'column-key-3': { typeDef: { type: 'Bool' }, value: true },
          },
        ],
        columns: [
          {
            headerName: '1',
            field: 'column-key-1',
          },
          {
            headerName: '2',
            field: 'column-key-2',
          },
          {
            headerName: '3',
            field: 'column-key-3',
          },
        ],
      });
    });

    it('should produce a table from arity-2 and arity-3 relations', () => {
      const output = plainToArrow([
        { relationId: '/:table/:data/:b/Int32', columns: [[1, 3]] },
        {
          relationId: '/:table/:data/:a/Int32/String',
          columns: [
            [1, 2, 3],
            ['10', '20', '30'],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 1 },
            'column-key-:b': { typeDef: { type: 'Bool' }, value: true },
            'column-key-:a': { typeDef: { type: 'String' }, value: '10' },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 3 },
            'column-key-:b': { typeDef: { type: 'Bool' }, value: true },
            'column-key-:a': { typeDef: { type: 'String' }, value: '30' },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 2 },
            'column-key-:a': { typeDef: { type: 'String' }, value: '20' },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':b',
            field: 'column-key-:b',
          },
          {
            headerName: ':a',
            field: 'column-key-:a',
          },
        ],
      });
    });

    it('should produce a table with all columns when columns are specified as data, not constants', () => {
      const output = plainToArrow([
        {
          relationId: '/:table/:data/String/Int32/Int32',
          columns: [
            ['a', 'a', 'b', 'b'],
            [1, 2, 1, 2],
            [3, 5, 4, 6],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 1 },
            'column-key-a': { typeDef: { type: 'Int32' }, value: 3 },
            'column-key-b': { typeDef: { type: 'Int32' }, value: 4 },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 2 },
            'column-key-a': { typeDef: { type: 'Int32' }, value: 5 },
            'column-key-b': { typeDef: { type: 'Int32' }, value: 6 },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: 'a',
            field: 'column-key-a',
          },
          {
            headerName: 'b',
            field: 'column-key-b',
          },
        ],
      });
    });

    it('should produce a table when some columns are specified as data, and some as constants', () => {
      const output = plainToArrow([
        {
          relationId: '/:table/:data/:x/Int32/Int32',
          columns: [
            [1, 2],
            [10, 20],
          ],
        },
        {
          relationId: '/:table/:data/String/Int32/Int32',
          columns: [
            ['a', 'a', 'b', 'b'],
            [1, 2, 1, 2],
            [3, 5, 4, 6],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 1 },
            'column-key-:x': { typeDef: { type: 'Int32' }, value: 10 },
            'column-key-a': { typeDef: { type: 'Int32' }, value: 3 },
            'column-key-b': { typeDef: { type: 'Int32' }, value: 4 },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 2 },
            'column-key-:x': { typeDef: { type: 'Int32' }, value: 20 },
            'column-key-a': { typeDef: { type: 'Int32' }, value: 5 },
            'column-key-b': { typeDef: { type: 'Int32' }, value: 6 },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: ':x',
            field: 'column-key-:x',
          },
          {
            headerName: 'a',
            field: 'column-key-a',
          },
          {
            headerName: 'b',
            field: 'column-key-b',
          },
        ],
      });
    });

    it('should produce a table with sorted numerical headers', () => {
      const output = plainToArrow([
        {
          relationId: '/:table/:data/Int64/Int32/Int32',
          columns: [
            [2, 2, 10, 10],
            [1, 2, 1, 2],
            [4, 6, 3, 5],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 1 },
            'column-key-2': { typeDef: { type: 'Int32' }, value: 4 },
            'column-key-10': { typeDef: { type: 'Int32' }, value: 3 },
          },
          {
            'row-header-0': { typeDef: { type: 'Int32' }, value: 2 },
            'column-key-2': { typeDef: { type: 'Int32' }, value: 6 },
            'column-key-10': { typeDef: { type: 'Int32' }, value: 5 },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: '2',
            field: 'column-key-2',
          },
          {
            headerName: '10',
            field: 'column-key-10',
          },
        ],
      });
    });

    it('should produce table when rows are not in order', () => {
      const output = plainToArrow([
        {
          relationId: '/:table/:data/String/String/String',
          columns: [
            ['c1', 'c1', 'c2', 'c2'],
            ['r1', 'r2', 'r1', 'r2'],
            ['v1.1', 'v1.2', 'v2.1', 'v2.2'],
          ],
        },
      ]);

      expect(getTableData(output)).toMatchObject({
        errors: [],
        rows: [
          {
            'row-header-0': { typeDef: { type: 'String' }, value: 'r1' },
            'column-key-c1': { typeDef: { type: 'String' }, value: 'v1.1' },
            'column-key-c2': { typeDef: { type: 'String' }, value: 'v2.1' },
          },
          {
            'row-header-0': { typeDef: { type: 'String' }, value: 'r2' },
            'column-key-c1': { typeDef: { type: 'String' }, value: 'v1.2' },
            'column-key-c2': { typeDef: { type: 'String' }, value: 'v2.2' },
          },
        ],
        columns: [
          {
            headerName: '',
            field: 'row-header-0',
            cellClass: ['bg-gray-100'],
          },
          {
            headerName: 'c1',
            field: 'column-key-c1',
          },
          {
            headerName: 'c2',
            field: 'column-key-c2',
          },
        ],
      });
    });
  });

  describe('toJson', () => {
    it('should convert to json', () => {
      const obj = {
        foo: 'str',
        baz: {
          bigInt: BigInt('123456789101112131415'),
          num: 123,
          decimal: new Decimal('123456789101112131100.12'),
          decimal2: new Decimal('123.45'),
        },
      };

      expect(toJson(obj)).toMatchObject({
        foo: 'str',
        baz: {
          bigInt: 123456789101112130000,
          num: 123,
          decimal: 123456789101112130000,
          decimal2: 123.45,
        },
      });
    });
  });
});
