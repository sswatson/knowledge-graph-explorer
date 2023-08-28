import classNames from 'classnames';
import { RiArrowUpSLine } from 'react-icons/ri';

import { FlatNode } from './types';

export type NodeComponentProps<T, K = undefined> = {
  index: number;
  data: {
    flattenedData: FlatNode<T>[];
    context?: K;
    onOpen: (node: FlatNode<T>) => void;
    onNodeClick?: (node: FlatNode<T>) => void;
  };
};

export function Node<T, K>({ data, index }: NodeComponentProps<T, K>) {
  const { flattenedData, onOpen, onNodeClick } = data;
  const node = flattenedData[index];
  const left = node.depth * 20;

  const handleClick = () => {
    onNodeClick && onNodeClick(node);
    onOpen(node);
  };

  return (
    <div
      role='treeitem'
      className='flex cursor-pointer h-full'
      onClick={handleClick}
      tabIndex={index}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      <div className='' style={{ width: `${left}px` }} />
      {node.hasChildren && (
        <RiArrowUpSLine
          className={classNames(
            'w-5 h-5 text-gray-400 mr-2',
            node.collapsed ? 'transform rotate-90' : 'transform rotate-180',
          )}
        />
      )}
      <div className='flex-1'>{node.name}</div>
    </div>
  );
}
