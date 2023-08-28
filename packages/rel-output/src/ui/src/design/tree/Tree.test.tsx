import { dimension } from '@shopify/jest-dom-mocks';
import { fireEvent, render, screen } from '@testing-library/react';
import { range } from 'lodash-es';

import { NodeComponentProps } from './Node';
import { Tree } from './Tree';
import { TreeNode } from './types';

function expectNodes(nodes: string[]) {
  const treeitems = screen.getAllByRole('treeitem');

  expect(treeitems.length).toEqual(nodes.length);

  treeitems.forEach((item, i) => {
    expect(item).toHaveTextContent(nodes[i]);
  });
}

describe('Tree', () => {
  beforeEach(() => {
    dimension.mock({
      offsetWidth: 200,
      offsetHeight: 1000,
    });
  });

  afterEach(() => {
    dimension.restore();
  });

  const tree: TreeNode<string>[] = [
    {
      id: 'root-node-1',
      name: 'Root-node-1',
      data: 'Root1',
      children: [
        {
          id: 'node-1-1',
          name: 'Node-1-1',
          data: '1-1',
          children: [
            {
              id: 'node-1-1-1',
              name: 'Node-1-1-1',
              data: '1-1-1',
            },
          ],
        },
        {
          id: 'node-1-2',
          name: 'Node-1-2',
          data: '1-2',
        },
      ],
    },
    {
      id: 'root-node-2',
      name: 'Root-node-2',
      data: 'Root2',
      children: [
        {
          id: 'node-2-1',
          name: 'Node-2-1',
          data: '2-1',
        },
      ],
    },
  ];

  it('should render tree with initialy opened nodes', () => {
    const initialOpened = {
      'root-node-1': true,
      'node-1-1': true,
      'root-node-2': true,
    };

    render(<Tree data={tree} initialOpened={initialOpened} />);

    expectNodes([
      'Root-node-1',
      'Node-1-1',
      'Node-1-1-1',
      'Node-1-2',
      'Root-node-2',
      'Node-2-1',
    ]);
  });

  it('should virtual render', () => {
    const nodes = range(0, 100).map(i => ({
      id: `${i}`,
      name: `${i}`,
      data: i,
    }));

    render(<Tree itemSize={100} data={nodes} />);

    // virtualizer relies on getting sizes from getBoundingClientRect
    // since getBouindingClientRect doesn't work in jsdom,
    // it is detecting only 6 elements (first element + 5 overscan)
    expect(screen.getAllByRole('treeitem').length).toEqual(6);
  });

  it('should collapse/uncollapse nodes', () => {
    const handleOpenNodesMock = jest.fn();

    render(<Tree data={tree} onOpenedNodesChange={handleOpenNodesMock} />);

    expect(screen.getAllByRole('treeitem').length).toEqual(2);

    expectNodes(['Root-node-1', 'Root-node-2']);

    fireEvent.click(screen.getByRole('treeitem', { name: 'Root-node-1' }));

    expect(handleOpenNodesMock).toBeCalledWith({ 'root-node-1': true });

    expectNodes(['Root-node-1', 'Node-1-1', 'Node-1-2', 'Root-node-2']);

    fireEvent.click(screen.getByRole('treeitem', { name: 'Node-1-1' }));

    expect(handleOpenNodesMock).toBeCalledWith({
      'root-node-1': true,
      'node-1-1': true,
    });

    expectNodes([
      'Root-node-1',
      'Node-1-1',
      'Node-1-1-1',
      'Node-1-2',
      'Root-node-2',
    ]);
  });

  it('should handle node clicks', () => {
    const mockOnNodeClick = jest.fn();

    render(<Tree data={tree} onNodeClick={mockOnNodeClick} />);

    expect(screen.getAllByRole('treeitem').length).toEqual(2);

    fireEvent.click(screen.getByRole('treeitem', { name: 'Root-node-1' }));

    expect(mockOnNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'root-node-1',
        name: 'Root-node-1',
        data: 'Root1',
      }),
    );

    fireEvent.click(screen.getByRole('treeitem', { name: 'Node-1-1' }));

    expect(mockOnNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'node-1-1',
        name: 'Node-1-1',
        data: '1-1',
      }),
    );
  });

  it('should be able to search', () => {
    const { rerender } = render(<Tree data={tree} />);

    expectNodes(['Root-node-1', 'Root-node-2']);

    rerender(<Tree data={tree} search='1-1' />);

    expectNodes(['Root-node-1', 'Node-1-1', 'Node-1-1-1']);
  });

  it('should render custom node component', () => {
    const mockOnNodeClick = jest.fn();

    const NodeComponent = (props: NodeComponentProps<string>) => {
      const { data, index } = props;
      const node = data.flattenedData[index];

      return (
        <button
          role='treeitem'
          type='button'
          onClick={() => data.onNodeClick && data.onNodeClick(node)}
        >
          {node.name}-foo
        </button>
      );
    };

    render(
      <Tree
        data={tree}
        NodeComponent={NodeComponent}
        onNodeClick={mockOnNodeClick}
      />,
    );

    expectNodes(['Root-node-1-foo', 'Root-node-2-foo']);

    fireEvent.click(screen.getByRole('treeitem', { name: 'Root-node-1-foo' }));

    expect(mockOnNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'root-node-1',
        name: 'Root-node-1',
        data: 'Root1',
      }),
    );
  });

  it('should render tree with current node path opened', () => {
    render(<Tree data={tree} currentNodeId={'node-1-1-1'} />);
    expectNodes([
      'Root-node-1',
      'Node-1-1',
      'Node-1-1-1',
      'Node-1-2',
      'Root-node-2',
    ]);
  });
});
