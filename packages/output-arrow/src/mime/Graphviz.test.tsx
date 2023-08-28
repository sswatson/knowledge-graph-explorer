import { render, screen, waitFor } from '@testing-library/react';

import {
  ArrowRelation,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';
import { plainToArrow } from '@relationalai/utils';

import Graphviz, {
  buildSubGraphTree,
  emptyGraph,
  generateDot,
  getData,
  getValue,
} from './Graphviz';

function arrowToResultTable(relations: ArrowRelation[]) {
  return relations.map(r => new ResultTable(r));
}

describe('Graphviz', () => {
  describe('rendering', () => {
    it('should render a graph', async () => {
      const graphOutput = plainToArrow([
        { relationId: '/:graph/:data/:node/String', columns: [['node']] },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.graph.graphviz']],
        },
      ]);

      render(<Graphviz relations={graphOutput} />);

      await waitFor(() =>
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument(),
      );
      await waitFor(async () =>
        expect(await screen.findAllByText('node')).toHaveLength(2),
      );

      // check action buttons are present
      await waitFor(() =>
        expect(global.URL.createObjectURL).toHaveBeenCalled(),
      );
      await waitFor(async () =>
        expect(await screen.findByText('SVG')).toBeInTheDocument(),
      );
      expect(screen.getByText('PNG')).toBeInTheDocument();
      expect(screen.getByText('Dot')).toBeInTheDocument();
    });

    it('should render an error if no nodes or edges', async () => {
      const graphOutput = plainToArrow([
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.graph.graphviz']],
        },
      ]);

      render(<Graphviz relations={graphOutput} />);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeInTheDocument();
        expect(
          screen.getByText(
            'relation passed to `Graphviz` must contain tuples prefixed with `:node` and/or `:edge`',
            { exact: true },
          ),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('graphviz-mime').querySelector('svg'),
      ).not.toBeInTheDocument();

      // check action buttons are not present
      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('should render an error if unknown layout', async () => {
      const graphOutput = plainToArrow([
        { relationId: '/:graph/:data/:layout/String', columns: [['fake']] },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.graph.graphviz']],
        },
      ]);

      render(<Graphviz relations={graphOutput} />);

      await waitFor(async () => {
        expect(await screen.findByRole('alert')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Invalid `:layout` option', { exact: true }),
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('graphviz-mime').querySelector('svg'),
      ).not.toBeInTheDocument();
    });

    it('should render a graph with a set width and height', async () => {
      const graphOutput = plainToArrow([
        { relationId: '/:graph/:data/:node/String', columns: [['node']] },
        { relationId: '/:graph/:data/:width/Int64', columns: [[300]] },
        { relationId: '/:graph/:data/:height/Int64', columns: [[600]] },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.graph.graphviz']],
        },
      ]);

      render(<Graphviz relations={graphOutput} />);

      await waitFor(() => {
        const el = screen.getByTestId('graphviz-mime').querySelector('svg');

        expect(el).toBeInTheDocument();
        expect(el).toHaveAttribute('width', '300');
        expect(el).toHaveAttribute('height', '600');
      });
    });

    it('should handle graphviz error', async () => {
      const graphOutput = plainToArrow([
        { relationId: '/:graph/:data/:node/String', columns: [['node']] },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.graph.graphviz']],
        },
      ]);

      const stringifyMock = jest.spyOn(JSON, 'stringify');

      stringifyMock.mockReturnValue(`"A" [label="""];`);

      render(<Graphviz relations={graphOutput} />);

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
        expect(
          screen.getByText('syntax error', { exact: false }),
        ).toBeInTheDocument();
      });

      stringifyMock.mockRestore();
    });
  });

  describe('dot generation', () => {
    it('should return a directed graph by default', () => {
      const graphOutput = arrowToResultTable(
        plainToArrow([{ relationId: '/:node/String', columns: [['node']] }]),
      );

      const dot = generateDot(graphOutput);

      expect(dot).toContain('digraph');
    });

    it('should return an undirected graph', () => {
      const graphOutput = arrowToResultTable(
        plainToArrow([
          { relationId: '/:node/String', columns: [['node']] },
          { relationId: '/:directed/Bool', columns: [[false]] },
        ]),
      );

      const dot = generateDot(graphOutput);

      expect(dot).toContain('graph');
      expect(dot).not.toContain('digraph');
    });

    it('should return a subgraph', () => {
      const graphOutput = arrowToResultTable(
        plainToArrow([
          { relationId: '/:node/String', columns: [['node']] },
          {
            relationId: '/:subgraph/String/:node/String',
            columns: [['sub'], ['sub_node']],
          },
        ]),
      );

      const dot = generateDot(graphOutput);

      expect(dot).toContain('subgraph');
      expect(dot).toContain('cluster_sub');
    });

    it('should return multiple subgraphs', () => {
      const graphOutput = arrowToResultTable(
        plainToArrow([
          { relationId: '/:node/String', columns: [['node']] },
          {
            relationId: '/:subgraph/String/:node/String',
            columns: [
              ['sub1', 'sub1', 'sub1', 'sub2', 'sub2', 'sub2'],
              ['sub1_1', 'sub1_2', 'sub1_3', 'sub2_1', 'sub2_2', 'sub2_3'],
            ],
          },
          {
            relationId: '/:subgraph/String/:edge/String/String',
            columns: [
              ['sub1', 'sub1', 'sub2', 'sub2'],
              ['sub1_1', 'sub1_2', 'sub2_1', 'sub2_2'],
              ['sub1_2', 'sub1_3', 'sub2_2', 'sub2_3'],
            ],
          },
        ]),
      );

      const expectedDot = `digraph  {
  subgraph "cluster_sub1" {
    "sub1_1";
    "sub1_2";
    "sub1_3";
    "sub1_1" -> "sub1_2";
    "sub1_2" -> "sub1_3";
  }
  subgraph "cluster_sub2" {
    "sub2_1";
    "sub2_2";
    "sub2_3";
    "sub2_1" -> "sub2_2";
    "sub2_2" -> "sub2_3";
  }
  "node";

}`;
      const dot = generateDot(graphOutput);

      expect(dot).toEqual(expectedDot);
    });

    it('should error if subgraph parent does not exist', () => {
      const graphOutput = arrowToResultTable(
        plainToArrow([
          { relationId: '/:node/String', columns: [['node']] },
          {
            relationId: '/:subgraph/String/:node/String',
            columns: [
              ['sub', 'other'],
              ['sub_node', 'sub_other'],
            ],
          },
          {
            relationId: '/:subgraph/String/:parent/String',
            columns: [['sub_node'], ['nope']],
          },
        ]),
      );

      expect(() => generateDot(graphOutput)).toThrow(
        '`:parent` of a subgraph must contain the id of another subgraph',
      );
    });

    it('should handle BigInt', () => {
      const graphOutput = arrowToResultTable(
        plainToArrow([
          {
            relationId: '/:edge/Int64/Int64',
            columns: [[BigInt(1)], [BigInt(2)]],
          },
          {
            relationId: '/:node/Int64',
            columns: [[BigInt(1), BigInt(2)]],
          },
        ]),
      );

      const dot = generateDot(graphOutput);

      expect(dot).toContain('digraph');
    });

    it('should handle 128bit numbers', () => {
      const graphOutput = arrowToResultTable(
        plainToArrow([
          {
            relationId: '/:edge/Int128/Int128',
            columns: [[[BigInt(1), BigInt(0)]], [[BigInt(2), BigInt(0)]]],
          },
          {
            relationId: '/:node/Int128',
            columns: [
              [
                [BigInt(1), BigInt(0)],
                [BigInt(2), BigInt(0)],
              ],
            ],
          },
        ]),
      );

      const dot = generateDot(graphOutput);

      expect(dot).toContain('digraph');
    });

    it('should build a subgraph tree', () => {
      const subgraphTree = [
        {
          ...emptyGraph(),
          id: 'parent',
          subgraphs: [],
        },
      ];

      const subgraphChildren = [
        {
          ...emptyGraph(),
          id: 'child',
          parent: 'parent',
          subgraphs: [],
        },
      ];

      buildSubGraphTree(subgraphTree, []);
      expect(subgraphTree[0].subgraphs).toHaveLength(0);

      buildSubGraphTree(subgraphTree, subgraphChildren);

      expect(subgraphTree[0].subgraphs).toHaveLength(1);
    });

    describe('getData', () => {
      it('does not do anything with empty data', () => {
        const empty = emptyGraph();
        const parsed = getData([], true, true);

        expect(parsed).toEqual(empty);
      });

      it('parses nodes', () => {
        const data = arrowToResultTable(
          plainToArrow([
            { relationId: '/:node/String', columns: [['node']] },
            { relationId: '/:node/Int64', columns: [[123]] },
          ]),
        );
        const parsed = getData(data, true, true);

        expect(parsed.nodes).toEqual(['"node"', '123']);
      });

      it('errors on wrong arity nodes', () => {
        const data = arrowToResultTable(
          plainToArrow([
            {
              relationId: '/:node/String/String',
              columns: [['node'], ['node']],
            },
          ]),
        );

        expect(() => getData(data, true, true)).toThrow(
          '`:node` expects values with arity 1, received: 2',
        );
      });

      it('errors on nodes with no data', () => {
        const data = arrowToResultTable(
          plainToArrow([{ relationId: '/:node/String', columns: [[]] }]),
        );

        expect(() => getData(data, true, true)).toThrow(
          'received `:node` with no values',
        );
      });

      it('errors on subgraph with no data', () => {
        const data = arrowToResultTable(
          plainToArrow([{ relationId: '/:subgraph/String', columns: [[]] }]),
        );

        expect(() => getData(data, true, true)).toThrow(
          'received `:subgraph` with no values',
        );
      });

      it('parses edges', () => {
        const data = arrowToResultTable(
          plainToArrow([
            { relationId: '/:edge/String/Int64', columns: [['node'], [123]] },
          ]),
        );
        const parsed = getData(data, true, true);

        expect(parsed.edges).toEqual(['"node" -> 123']);
      });

      it('parses node attributes', () => {
        const data = arrowToResultTable(
          plainToArrow([
            {
              relationId: '/:node_attribute/String/String/String',
              columns: [['node'], ['font'], ['arial']],
            },
          ]),
        );
        const parsed = getData(data, true, true);

        expect(parsed.nodeAttrs.get('"node"')).toEqual(['font="arial"']);
      });

      it('parses edge attributes', () => {
        const data = arrowToResultTable(
          plainToArrow([
            {
              relationId: '/:edge_attribute/String/String/String/String',
              columns: [['node'], ['other_node'], ['font'], ['arial']],
            },
          ]),
        );
        const parsed = getData(data, true, true);

        expect(parsed.edgeAttrs.get('"node" -> "other_node"')).toEqual([
          'font="arial"',
        ]);
      });

      it('parses attributes', () => {
        const data = arrowToResultTable(
          plainToArrow([
            {
              relationId: '/:attribute/:graph/String/String',
              columns: [['font'], ['arial']],
            },
            {
              relationId: '/:attribute/:graph/String/Int64',
              columns: [['size'], [123]],
            },
          ]),
        );
        const parsed = getData(data, true, true);

        expect(parsed.attrs.get('graph')).toEqual(['font="arial"', 'size=123']);
      });

      it('adds cluster to subgraph IDs', () => {
        const data = arrowToResultTable(
          plainToArrow([
            {
              relationId: '/:subgraph/String/:node/String',
              columns: [
                ['sub', 'other'],
                ['sub_node', 'sub_other'],
              ],
            },
          ]),
        );
        const parsed = getData(data, true, true);

        expect(parsed.subgraphData.get('"cluster_sub"')).toBeDefined();
      });

      it('adds cluster to subgraph parent IDs', () => {
        const data = arrowToResultTable(
          plainToArrow([
            { relationId: '/:parent/String', columns: [['nope']] },
          ]),
        );
        const parsed = getData(data, true, true);

        expect(parsed.parent).toEqual('"cluster_nope"');
      });

      it('does not add cluster to subgraph IDs when not clustered', () => {
        const data = arrowToResultTable(
          plainToArrow([
            {
              relationId: '/:subgraph/String/:node/String',
              columns: [
                ['sub', 'other'],
                ['sub_node', 'sub_other'],
              ],
            },
          ]),
        );
        const parsed = getData(data, true, false);

        expect(parsed.subgraphData.get('"cluster_sub"')).not.toBeDefined();
        expect(parsed.subgraphData.get('"sub"')).toBeDefined();
      });

      it('does not add cluster to subgraph parent IDs when not clustered', () => {
        const data = arrowToResultTable(
          plainToArrow([
            { relationId: '/:parent/String', columns: [['nope']] },
          ]),
        );
        const parsed = getData(data, true, false);

        expect(parsed.parent).toEqual('"nope"');
      });
    });

    describe('getValue', () => {
      it('gets a boolean', () => {
        const data = arrowToResultTable(
          plainToArrow([{ relationId: '/:directed/Bool', columns: [[false]] }]),
        );

        expect(getValue(data, ':directed', false)).toEqual(false);
        expect(getValue(data, ':directed', true)).toEqual(false);
      });

      it('gets defaults with a boolean', () => {
        const data = arrowToResultTable(
          plainToArrow([{ relationId: '/:other/Bool', columns: [[false]] }]),
        );

        expect(getValue(data, ':directed', false)).toEqual(false);
        expect(getValue(data, ':directed', true)).toEqual(true);
      });

      it('gets a string', () => {
        const data = arrowToResultTable(
          plainToArrow([
            { relationId: '/:directed/String', columns: [['false']] },
          ]),
        );

        expect(getValue(data, ':directed', 'false')).toEqual('false');
        expect(getValue(data, ':directed', 'true')).toEqual('false');
      });

      it('gets defaults with a string', () => {
        const data = arrowToResultTable(
          plainToArrow([
            { relationId: '/:other/String', columns: [['false']] },
          ]),
        );

        expect(getValue(data, ':directed', 'false')).toEqual('false');
        expect(getValue(data, ':directed', 'true')).toEqual('true');
      });
    });
  });
});
