import { TreeNode } from './types';

export const filterTree = (
  nodes: TreeNode<any>[],
  filterFn: (node: TreeNode<any>) => boolean,
) => {
  const getNodes = (result: TreeNode<any>[], node: TreeNode<any>) => {
    if (filterFn(node)) {
      result.push(node);

      return result;
    }

    if (node.children) {
      const children = node.children.reduce(getNodes, []);

      if (children.length > 0) {
        result.push({ ...node, children });
      }
    }

    return result;
  };

  return nodes.reduce(getNodes, []);
};
