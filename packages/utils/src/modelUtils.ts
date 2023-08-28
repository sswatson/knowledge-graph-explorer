import { isEmpty, isString, sortBy } from 'lodash-es';
import { ParsedUrlQuery } from 'querystring';

export function extractNameFromPath(path: string) {
  if (!isEmpty(path)) {
    const lastIndex = path.lastIndexOf('/');

    return lastIndex > 0 ? path.slice(lastIndex + 1, path.length) : path;
  }

  return path;
}

export function parseSelection(query: ParsedUrlQuery) {
  const selection = query.pos as string;

  if (!isString(selection) || isEmpty(selection)) {
    return null;
  }

  const [from, to] = selection.split(':').map(x => Number.parseInt(x));

  if (Number.isInteger(from) && Number.isInteger(to)) {
    if (to < from) {
      return null;
    }

    return { anchor: from, head: to };
  }

  return null;
}

export type Idb = {
  name: string;
  pos: { from: number; to: number; line: number; column: number };
  children?: Idb[];
  modelName: string;
  type: string;
};

export type ModelNode<T extends Model> = {
  path: string;
  name: string;
  children: ModelNode<T>[];
  model?: T;
  idb?: Idb;
};

type Model = {
  name: string;
  value: string;
};

function modelNodeCompare<T extends Model>(node: ModelNode<T>) {
  // Notebook folders should be at the top
  if (!node.model?.name) {
    return 1;
  }

  // Models should be under notebooks folders
  if (node.model) {
    return 2;
  }

  return 0;
}

function sortTree<T extends Model>(nodes: ModelNode<T>[]) {
  return sortBy(nodes, modelNodeCompare, 'name').map(n => {
    if (n.model?.name && n.children) {
      return n;
    }

    if (n.children) {
      n.children = sortTree(n.children);
    }

    return n;
  });
}

export function convertToTree<T extends Model>(
  models: T[],
  idbsByModel?: Map<string, Idb[]>,
) {
  const tree: ModelNode<T>[] = [];

  models.forEach(model => {
    createNode(model.name.split('/'), 0, model, tree, idbsByModel);
  });

  return sortTree(tree);
}

function createIdbNode<T extends Model>(
  modelPath: string[],
  idbs: Idb[],
  idbPath: string[] = [],
): ModelNode<T>[] {
  return idbs.map((idb, index) => ({
    path: `${modelPath.join('/')}/${
      idbPath.length ? `${idbPath.join('/')}/` : ''
    }${idb.name}/${index}`,
    name: idb.name,
    idb: idb as any,
    children:
      idb.children && idb.children.length > 0
        ? createIdbNode(modelPath, idb.children, [...idbPath, idb.name])
        : [],
  }));
}

function createNode<T extends Model>(
  modelPath: string[],
  current: number,
  model: T,
  tree: ModelNode<T>[],
  idbsByModel?: Map<string, Idb[]>,
) {
  const name = modelPath[current];
  const idx = tree.findIndex(node => node.name === name);

  // Node has not been created yet
  if (idx < 0) {
    const node: ModelNode<T> = {
      path: modelPath.slice(0, current + 1).join('/'),
      name: name,
      children: [],
    };

    tree.push(node);

    if (current === modelPath.length - 1) {
      node.model = model;
      node.children = idbsByModel
        ? createIdbNode(modelPath, idbsByModel.get(model.name) ?? [])
        : [];

      return;
    }

    if (current < modelPath.length) {
      createNode(
        modelPath,
        current + 1,
        model,
        tree[tree.length - 1].children,
        idbsByModel,
      );
    }
  } else {
    createNode(modelPath, current + 1, model, tree[idx].children, idbsByModel);
  }
}

export async function exportModels(models: Model[]) {
  const dirHandle = await window.showDirectoryPicker();

  const tree = convertToTree(models);

  for (const node of tree) {
    await exportModelNode(node, dirHandle);
  }
}

async function exportModelNode<T extends Model>(
  node: ModelNode<T>,
  // eslint-disable-next-line no-undef
  dirHandle: FileSystemDirectoryHandle,
) {
  if (node.model) {
    const filename = node.name.endsWith('.rel')
      ? node.name
      : `${node.name}.rel`;
    const fileHandle = await dirHandle.getFileHandle(filename, {
      create: true,
    });

    const writable = await fileHandle.createWritable();

    await writable.write(node.model.value);
    await writable.close();
  } else if (node.children && node.children.length > 0) {
    const newDirHandle = await dirHandle.getDirectoryHandle(node.name, {
      create: true,
    });

    for (const n of node.children) {
      await exportModelNode(n, newDirHandle);
    }
  }
}
