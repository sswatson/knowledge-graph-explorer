export type TreeNode<T> = {
  id: string;
  name: string;
  data: T;
  children?: TreeNode<T>[];
  hasChildren?: boolean;
};

export type FlatNode<T> = TreeNode<T> & {
  hasChildren: boolean;
  depth: number;
  collapsed?: boolean;
  isCurrent?: boolean;
};
