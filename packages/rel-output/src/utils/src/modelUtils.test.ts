import { convertToTree, parseSelection } from './modelUtils';

describe('modelUtils', () => {
  it('should parse selection', () => {
    expect(parseSelection({})).toEqual(null);
    expect(parseSelection({ pos: '' })).toEqual(null);
    expect(parseSelection({ pos: '1:5' })).toEqual({ anchor: 1, head: 5 });
    expect(parseSelection({ pos: '123:foo' })).toEqual(null);
    expect(parseSelection({ pos: 'foo:123' })).toEqual(null);
    expect(parseSelection({ pos: '123:45' })).toEqual(null);
  });

  it('should convert models into a tree', () => {
    const models = [
      {
        name: 'nopath',
        value: '',
      },
      {
        name: 'stdlib',
        value: `
          def add = ...
          // 
          def subtract = ...
        `,
      },
      {
        name: 'dir1/dir2/foo',
        value: `
          //
        `,
      },
      {
        name: 'aModel',
        value: `
          //
        `,
      },
      {
        name: 'testSrc',
        value: `
          def test1 = ...
        `,
      },
      {
        name: 'dir1/dir2/baz',
        value: `
          def baz = 123
          //
          //
          def abc = 321
        `,
      },
    ];

    const tree = convertToTree(models);

    const expectedTree = [
      {
        path: 'dir1',
        name: 'dir1',
        children: [
          {
            path: 'dir1/dir2',
            name: 'dir2',
            children: [
              {
                path: 'dir1/dir2/baz',
                name: 'baz',
                children: [],
                model: models[5],
              },
              {
                path: 'dir1/dir2/foo',
                name: 'foo',
                children: [],
                model: models[2],
              },
            ],
          },
        ],
      },
      {
        path: 'aModel',
        name: 'aModel',
        children: [],
        model: models[3],
      },
      {
        path: 'nopath',
        name: 'nopath',
        children: [],
        model: models[0],
      },
      {
        path: 'stdlib',
        name: 'stdlib',
        children: [],
        model: models[1],
      },
      {
        path: 'testSrc',
        name: 'testSrc',
        children: [],
        model: models[4],
      },
    ];

    expect(tree).toEqual(expectedTree);
  });
});
