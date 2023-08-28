import {
  ArrowRelation,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';

import {
  Diagnostic,
  filterResults,
  IcViolation,
  parseDiagnostics,
  parseIcViolations,
  plainToArrow,
  sanitizeRelationName,
  trimRel,
} from './relationUtils';

const diagnosticRelations: ArrowRelation[] = plainToArrow([
  {
    relationId:
      '/:rel/:catalog/:diagnostic/:range/:start/:line/Int64/Int64/Int64',
    columns: [
      [BigInt(1), BigInt(1), BigInt(3)],
      [BigInt(1), BigInt(2), BigInt(1)],
      [BigInt(1), BigInt(2), BigInt(1)],
    ],
  },
  {
    relationId:
      '/:rel/:catalog/:diagnostic/:range/:start/:character/Int64/Int64/Int64',
    columns: [
      [BigInt(1), BigInt(1), BigInt(3)],
      [BigInt(1), BigInt(2), BigInt(1)],
      [BigInt(17), BigInt(4), BigInt(14)],
    ],
  },
  {
    relationId:
      '/:rel/:catalog/:diagnostic/:range/:end/:line/Int64/Int64/Int64',
    columns: [
      [BigInt(1), BigInt(1), BigInt(3)],
      [BigInt(1), BigInt(2), BigInt(1)],
      [BigInt(1), BigInt(3), BigInt(1)],
    ],
  },
  {
    relationId:
      '/:rel/:catalog/:diagnostic/:range/:end/:character/Int64/Int64/Int64',
    columns: [
      [BigInt(1), BigInt(1), BigInt(3)],
      [BigInt(1), BigInt(2), BigInt(1)],
      [BigInt(17), BigInt(42), BigInt(17)],
    ],
  },
  {
    relationId: '/:rel/:catalog/:diagnostic/:message/Int64/String',
    columns: [
      [BigInt(1), BigInt(3)],
      ['message 1', 'message 2'],
    ],
  },
  {
    relationId: '/:rel/:catalog/:diagnostic/:severity/Int64/String',
    columns: [
      [BigInt(1), BigInt(3)],
      ['error', 'error'],
    ],
  },
  {
    relationId: '/:rel/:catalog/:diagnostic/:code/Int64/String',
    columns: [
      [BigInt(1), BigInt(3)],
      ['PARSE_ERROR', 'UNBOUND_VARIABLE'],
    ],
  },
  {
    relationId: '/:rel/:catalog/:diagnostic/:report/Int64/String',
    columns: [
      [BigInt(1), BigInt(3)],
      ['report 1', 'report 2'],
    ],
  },
  {
    relationId: '/:rel/:catalog/:diagnostic/:model/Int64/String',
    columns: [[BigInt(3)], ['foo/bar']],
  },
]);

const expectedDiagnostics: Diagnostic[] = [
  {
    range: [
      {
        start: {
          line: 1,
          character: 14,
        },
        end: {
          line: 1,
          character: 17,
        },
      },
    ],
    message: 'message 2',
    severity: 'error',
    code: 'UNBOUND_VARIABLE',
    report: 'report 2',
    model: 'foo/bar',
  },
  {
    range: [
      {
        start: {
          line: 1,
          character: 17,
        },
        end: {
          line: 1,
          character: 17,
        },
      },
      {
        start: {
          line: 2,
          character: 4,
        },
        end: {
          line: 3,
          character: 42,
        },
      },
    ],
    message: 'message 1',
    severity: 'error',
    code: 'PARSE_ERROR',
    report: 'report 1',
  },
];

const icViolationRelations: ArrowRelation[] = plainToArrow([
  {
    relationId:
      '/:rel/:catalog/:ic_violation/:range/:start/:line/HashValue/Int64',
    columns: [
      [
        [BigInt(123), BigInt(0)],
        [BigInt(456), BigInt(0)],
      ],
      [BigInt(5), BigInt(2)],
    ],
  },
  {
    relationId:
      '/:rel/:catalog/:ic_violation/:range/:start/:character/HashValue/Int64',
    columns: [
      [
        [BigInt(123), BigInt(0)],
        [BigInt(456), BigInt(0)],
      ],
      [BigInt(13), BigInt(2)],
    ],
  },
  {
    relationId:
      '/:rel/:catalog/:ic_violation/:range/:end/:line/HashValue/Int64',
    columns: [
      [
        [BigInt(123), BigInt(0)],
        [BigInt(456), BigInt(0)],
      ],
      [BigInt(5), BigInt(2)],
    ],
  },
  {
    relationId:
      '/:rel/:catalog/:ic_violation/:range/:end/:character/HashValue/Int64',
    columns: [
      [
        [BigInt(123), BigInt(0)],
        [BigInt(456), BigInt(0)],
      ],
      [BigInt(19), BigInt(22)],
    ],
  },
  {
    relationId: '/:rel/:catalog/:ic_violation/:report/HashValue/String',
    columns: [
      [
        [BigInt(123), BigInt(0)],
        [BigInt(456), BigInt(0)],
      ],
      ['report 1', 'report 2'],
    ],
  },
  {
    relationId: '/:rel/:catalog/:ic_violation/:model/HashValue/String',
    columns: [[[BigInt(456), BigInt(0)]], ['foo/bar']],
  },
  {
    relationId: '/:rel/:catalog/:ic_violation/:name/HashValue/String',
    columns: [[[BigInt(456), BigInt(0)]], ['icName']],
  },
  {
    relationId:
      '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#constaint#0',
    columns: [[[BigInt(123), BigInt(0)]]],
  },
  {
    relationId:
      '/:rel/:catalog/:ic_violation/:decl_id/HashValue/:rel-query-action##123#icName#0',
    columns: [[[BigInt(456), BigInt(0)]]],
  },
  {
    relationId: '/:rel/:catalog/:ic_violation/:output/HashValue/:foo/String',
    columns: [
      [
        [BigInt(123), BigInt(0)],
        [BigInt(123), BigInt(0)],
        [BigInt(456), BigInt(0)],
      ],
      ['foo1', 'foo2', 'foo3'],
    ],
  },
  {
    relationId: '/:rel/:catalog/:ic_violation/:output/HashValue',
    columns: [[[BigInt(123), BigInt(0)]]],
  },
  {
    relationId: '/:rel/:catalog/:ic_violation/:output/HashValue/:bar/String',
    columns: [[[BigInt(456), BigInt(0)]], ['bar']],
  },
]);

const expectedIcViolations: IcViolation[] = [
  {
    decl_id: ':rel-query-action##123#icName#0',
    name: 'icName',
    report: 'report 2',
    model: 'foo/bar',
    range: {
      start: {
        line: 2,
        character: 2,
      },
      end: {
        line: 2,
        character: 22,
      },
    },
    output: expect.anything(),
  },
  {
    decl_id: ':rel-query-action##123#constaint#0',
    report: 'report 1',
    range: {
      start: {
        line: 5,
        character: 13,
      },
      end: {
        line: 5,
        character: 19,
      },
    },
    output: expect.anything(),
  },
];

describe('relationUtils', () => {
  it('should sanitize relation name', () => {
    expect(sanitizeRelationName('123-foαo_bar.ba$z3')).toEqual('foαo_barbaz3');
  });

  it('should trim rel string', () => {
    expect(trimRel('def output = foo')).toEqual('def output = foo');

    const expectedResult = [
      'def foo = blah_blah[{',
      '  :a;',
      '  :b',
      '}]',
      '',
      'def output = foo',
    ].join('\n');
    const result = trimRel(`
      def foo = blah_blah[{
        :a;
        :b
      }]
      
      def output = foo
    `);

    expect(result).toEqual(expectedResult);
  });

  describe('filterResults', () => {
    it('should find relations', () => {
      const relations = plainToArrow([
        {
          relationId: '/:output/:foo/:bar/Int32/String',
          columns: [
            [1, 2],
            ['a', 'b'],
          ],
        },
        {
          relationId: '/:output/:bar/Int32',
          columns: [[1, 2]],
        },
        {
          relationId: '/:output/:foo/:baz/Int32',
          columns: [[1, 2]],
        },
        {
          relationId: '/:output',
          columns: [],
        },
      ]);

      const results = relations.map(r => new ResultTable(r));

      const filtered = filterResults(results, [':output', ':foo']);

      expect(filtered.length).toEqual(2);
      expect(filtered[0].get(0)).toEqual([':output', ':foo', ':bar', 1, 'a']);
      expect(filtered[1].get(0)).toEqual([':output', ':foo', ':baz', 1]);
    });

    it('should find relations with physical columns', () => {
      const relations = plainToArrow([
        {
          relationId: '/:output/:foo/String/Int32',
          columns: [
            ['a', 'b'],
            [1, 2],
          ],
        },
        {
          relationId: '/:output/:foo/Int32',
          columns: [[1, 2]],
        },
        {
          relationId: '/:output/:foo/String',
          columns: [['x', 'y']],
        },
      ]);

      const results = relations.map(r => new ResultTable(r));

      const filtered = filterResults(results, [':output', ':foo', 'String']);

      expect(filtered.length).toEqual(2);
      expect(filtered.length).toEqual(2);
      expect(filtered[0].get(0)).toEqual([':output', ':foo', 'a', 1]);
      expect(filtered[1].get(0)).toEqual([':output', ':foo', 'x']);
    });
  });

  it('should parse and sort diagnostics', () => {
    const result = parseDiagnostics(diagnosticRelations);

    expect(result).toEqual(expectedDiagnostics);
  });

  it('should parse and sort ic violations', () => {
    const result = parseIcViolations(icViolationRelations);

    expect(result).toEqual(expectedIcViolations);

    expect(result[1].output[0].values()).toEqual([
      [':foo', 'foo1'],
      [':foo', 'foo2'],
    ]);
    expect(result[1].output.length).toEqual(2);

    expect(result[0].output[0].values()).toEqual([[':foo', 'foo3']]);
    expect(result[0].output[1].values()).toEqual([[':bar', 'bar']]);
    expect(result[0].output.length).toEqual(2);

    expect(result[1].report).toStrictEqual('report 1');
    expect(result[0].report).toStrictEqual('report 2');
  });
});
