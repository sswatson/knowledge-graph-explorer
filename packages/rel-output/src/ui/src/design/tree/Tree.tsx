import { ScrollToOptions, useVirtualizer } from '@tanstack/react-virtual';
import { isEqual } from 'lodash-es';
import { ComponentType, useEffect, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Node as DefaultNode, NodeComponentProps } from './Node';
import { FlatNode, TreeNode } from './types';
import { filterTree } from './utils';

type TreeProps<T, K> = {
  data: TreeNode<T>[];
  search?: string;
  NodeComponent?: ComponentType<NodeComponentProps<T, K>>;
  onNodeClick?: (node: FlatNode<T>) => void;
  itemSize?: number;
  initialOpened?: { [id: string]: boolean };
  openedNodes?: { [id: string]: boolean };
  currentNodeId?: string;
  scrollToAlign?: ScrollToOptions['align'];
  secondaryCurrentNodes?: string[];
  onOpenedNodesChange?: (openedNodesIds: Record<string, boolean>) => void;
  context?: K;
};

export function Tree<T, K>({
  data,
  search = '',
  NodeComponent = DefaultNode,
  onNodeClick,
  itemSize = 33,
  initialOpened = {},
  openedNodes = {},
  currentNodeId,
  secondaryCurrentNodes = [],
  scrollToAlign,
  onOpenedNodesChange,
  context,
}: TreeProps<T, K>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const [openedNodeIds, setOpenedNodeIds] = useState<{ [id: string]: boolean }>(
    initialOpened,
  );

  const [currentNodeHandled, setCurrentNodeHandled] = useState(false);

  useEffect(() => {
    setCurrentNodeHandled(false);
    handleCurrentNode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId]);

  useEffect(() => {
    !currentNodeHandled && handleCurrentNode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    setOpenedNodeIds(prevState => {
      const newState = {
        ...prevState,
        ...openedNodes,
      };

      if (isEqual(newState, prevState)) {
        return prevState;
      }

      return newState;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedNodes]);

  const handleCurrentNode = () => {
    if (currentNodeId) {
      openCurrentNodePath(data);
    }

    if (currentNodeId && parentRef.current) {
      const itemIndex = flattenedData.findIndex(node => {
        return node.id == currentNodeId;
      });

      if (itemIndex > -1) {
        virtualizer.scrollToIndex(itemIndex, {
          align: scrollToAlign ?? 'start',
        });
        setCurrentNodeHandled(true);
      }
    }
  };

  useEffect(() => {
    onOpenedNodesChange && onOpenedNodesChange(openedNodeIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedNodeIds]);

  const onOpen = (node: FlatNode<T>) => {
    const ids = {
      ...openedNodeIds,
      [node.id]: !!node.collapsed,
    };

    setOpenedNodeIds(ids);
  };

  const filterFn = (node: TreeNode<T>) => {
    return !!node.name.toString().toLowerCase().includes(search.toLowerCase());
  };

  const flattenTree = (tree: TreeNode<T>[]) => {
    const flatList: FlatNode<T>[] = [];

    tree.forEach(node => {
      flattenNode(node, 0, flatList);
    });

    return flatList;
  };

  const flattenNode = (
    node: TreeNode<T>,
    depth: number,
    flatList: FlatNode<T>[],
  ) => {
    const { id, name, children, data, hasChildren } = node;
    const isOpen =
      openedNodeIds[id] !== undefined ? openedNodeIds[id] : !!search;
    const isCurrent =
      (currentNodeId && id === currentNodeId) ||
      secondaryCurrentNodes.includes(id);

    flatList.push({
      id,
      name,
      hasChildren: hasChildren || (children ? children.length > 0 : false),
      depth,
      collapsed: !isOpen,
      data,
      isCurrent,
    });

    if (isOpen && children) {
      children.forEach(n => flattenNode(n, depth + 1, flatList));
    }
  };

  const openCurrentNodePath = (nodes: TreeNode<T>[]) => {
    const getCurrentNodePath = (
      pathIdsMap: { [id: string]: boolean },
      node: TreeNode<T>,
    ) => {
      if (node.id === currentNodeId) {
        return true;
      }

      if (node.children) {
        const inPath = node.children.some(node =>
          getCurrentNodePath(pathIdsMap, node),
        );

        if (inPath) {
          pathIdsMap[node.id] = true;

          return true;
        }
      }

      return false;
    };

    const pathIdsMap: { [id: string]: boolean } = {};

    nodes.forEach(node => getCurrentNodePath(pathIdsMap, node));

    // update only if there are new values
    setOpenedNodeIds(prevState => {
      const newState = {
        ...prevState,
        ...pathIdsMap,
      };

      if (isEqual(newState, prevState)) {
        return prevState;
      }

      return newState;
    });
  };

  const filteredData = search ? filterTree(data, filterFn) : data;
  const flattenedData = flattenTree(filteredData);

  const count = flattenedData.length;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className='h-full overflow-hidden' role='tree'>
      <AutoSizer>
        {({ height, width }) => (
          <div
            ref={parentRef}
            style={{
              overflowY: 'auto',
              height,
              width,
            }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: 'fit-content',
                minWidth: '100%',
              }}
            >
              {items.length > 0 && (
                <div
                  style={{
                    transform: `translateY(${items[0].start}px)`,
                  }}
                >
                  {items.map(item => {
                    const { index, size } = item;

                    return (
                      <div
                        key={index}
                        style={{
                          height: `${size}px`,
                          minWidth: '100%',
                        }}
                      >
                        <NodeComponent
                          index={index}
                          data={{ flattenedData, onOpen, onNodeClick, context }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );
}
