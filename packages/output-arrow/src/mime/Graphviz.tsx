import classNames from 'classnames';
import {
  Engine,
  Graphviz as GraphvizT,
  graphviz,
  GraphvizOptions,
} from 'd3-graphviz';
import { Selection } from 'd3-selection';
import { zoomIdentity, zoomTransform } from 'd3-zoom';
import { useLayoutEffect, useRef, useState } from 'react';
import {
  MdDownload,
  MdOutlineRemoveRedEye,
  MdYoutubeSearchedFor,
  MdZoomIn,
  MdZoomOut,
} from 'react-icons/md';

import {
  ArrowRelation,
  RelTypedValue,
  ResultTable,
} from '@relationalai/rai-sdk-javascript/web';
import {
  Button,
  ErrorAlert,
  LinkButton,
  Spinner,
  StopIcon,
} from '@relationalai/ui';
import { filterResults } from '@relationalai/utils';

type Value = RelTypedValue['value'];

const LAYOUT_ENGINES = new Set([
  'circo',
  'dot',
  'fdp',
  'neato',
  'osage',
  'patchwork',
  'twopi',
]);

type GraphvizProps = {
  relations: ArrowRelation[];
  isNested?: boolean;
};

/**
 * Component that renders a graph relation as a directed or undirected graph
 * with graphviz.
 *
 * The dependency viz.js throws off a warning (`Invalid asm.js: Function
 * definition doesn't match use`) that appears to be harmless and the internet
 * indicates to just ignore. There is also a more recent version which uses
 * wasm instead of viz.js, however the build process is quite clunky. This
 * could be investigated/implemented in the future.
 */
export default function Graphviz({ relations, isNested }: GraphvizProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const graphvizRef = useRef<GraphvizT<any, any, any, any>>();
  const [error, setError] = useState('');
  const [dot, setDot] = useState('');
  const [png, setPng] = useState('');
  const [isRendered, setIsRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const handleError = (error: any) => {
    if (domRef.current) {
      setIsRendering(false);
      // graphviz can throw strings as errors
      setError(error.message || error);

      // clear the current chart if it exists
      domRef.current.innerHTML = '';
    }
  };

  const cancelRender = () => {
    const graphviz = graphvizRef.current;

    if (graphviz && 'destroy' in graphviz) {
      // The typings are wrong
      // See https://github.com/magjac/d3-graphviz/blob/master/src/destroy.js
      (graphviz as any).destroy();
    }
  };

  useLayoutEffect(() => {
    const div = domRef.current;
    let timeout: ReturnType<typeof setTimeout>;

    if (div) {
      setError('');
      setIsRendered(false);
      domRef.current.innerHTML = '';

      const options: GraphvizOptions = {
        fit: true,
        height: (isNested && (div.parentElement?.offsetHeight || 0)) || 500,
        width: (isNested && (div.parentElement?.offsetWidth || 0)) || 500,
        zoom: true,
        useWorker: true,
      };

      try {
        const results = filterResults(
          relations.map(r => new ResultTable(r)),
          [':graph', ':data'],
        ).map(r => r.sliceColumns(2));

        options.width = Number(
          getValue(results, ':width', domRef.current.clientWidth),
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        options.height = Number(getValue(results, ':height', options.height!));
        options.engine = getValue<Engine>(results, ':layout', 'dot');

        if (!LAYOUT_ENGINES.has(options.engine)) {
          throw new Error('Invalid `:layout` option');
        }

        const dotSource = generateDot(results);

        setDot(dotSource);

        const instance = graphviz(domRef.current, options);

        // Setting the flag via timeout to avoid flashing
        // if rendering is fast
        timeout = setTimeout(() => {
          setIsRendering(true);
        }, 1000);

        graphvizRef.current = instance;
        instance.onerror(handleError);
        instance.renderDot(dotSource, () => {
          if (domRef.current) {
            clearTimeout(timeout);
            setIsRendering(false);
            setIsRendered(true);

            getPNG(
              domRef.current,
              options.width as number,
              options.height as number,
            ).then(res => setPng(res));
          }
        });
      } catch (error: any) {
        handleError(error);
      }

      return () => {
        clearTimeout(timeout);
        cancelRender();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relations]);

  const getZoomSelection = () => {
    const graphviz = graphvizRef.current;

    if (graphviz && graphviz.zoomSelection()) {
      const sel = graphviz.zoomSelection();

      if (sel) {
        return (sel as any) as Selection<any, any, any, any>;
      }
    }

    throw new Error(`Graphviz: couldn't get zoom selection.`);
  };

  const getCurrentScale = () => {
    return zoomTransform(getZoomSelection().node()).k;
  };

  const setZoomScale = (scale: number) => {
    const graphviz = graphvizRef.current;
    const div = domRef.current;
    const svg = div?.querySelector('svg');
    const g = div?.querySelector('g');

    if (graphviz && svg && g) {
      const viewBox = (svg.getAttribute('viewBox') || '').split(' ');
      const bbox = g.getBBox();
      const zoomSelection = getZoomSelection();
      const { x, y, k } = zoomTransform(zoomSelection.node());
      const xOffset0 = x + bbox.x * k;
      const yOffset0 = y + bbox.y * k;
      const xCenter = Number.parseInt(viewBox[2]) / 2;
      const yCenter = Number.parseInt(viewBox[3]) / 2;
      const xOffset = xCenter - ((xCenter - xOffset0) * scale) / k;
      const yOffset = yCenter - ((yCenter - yOffset0) * scale) / k;
      const translateX = -bbox.x * scale + xOffset;
      const translateY = -bbox.y * scale + yOffset;

      const transform = zoomIdentity
        .translate(translateX, translateY)
        .scale(scale);
      const zoomBehavior = graphviz.zoomBehavior();

      if (zoomBehavior) {
        zoomSelection.call(zoomBehavior.transform, transform);
      }
    }
  };

  const handleReset = () => {
    if (graphvizRef.current) {
      graphvizRef.current.resetZoom();
    }
  };

  const handleZoomIn = () => setZoomScale(getCurrentScale() * 1.2);

  const handleZoomOut = () => setZoomScale(getCurrentScale() / 1.2);

  const handleCancel = () => {
    cancelRender();
    setIsRendering(false);
    setError('Rendering has been cancelled.');
  };

  return (
    <div
      className={classNames(
        isNested ? 'absolute inset-0' : 'min-h-[2em] relative',
      )}
    >
      {error && <ErrorAlert key={error} error={error} />}
      {/* This's super annoying :(
        But that's how d3-graphviz works currently
        There's CopyWebpackPlugin in next.config.js that copies the wasm file and this script into the static folder
      See: https://github.com/magjac/d3-graphviz#defining-the-hpcc-jswasm-script-tag */}
      <script
        src='/_next/static/chunks/@hpcc-js-wasm-index.min.js'
        type='javascript/worker'
      ></script>

      {isRendering && (
        <div className='flex items-center justify-center absolute inset-0 z-10'>
          <span className='text-gray-500 inline-block mr-2'>Rendering</span>{' '}
          <Spinner />
        </div>
      )}
      <div
        className={classNames(
          !error && 'absolute top-0 inset-x-0 z-20',
          'flex justify-between',
          isNested && 'p-3',
        )}
      >
        <div className='flex gap-3'>
          <LinkButton
            size='xs'
            type='secondary'
            target='_blank'
            href={getDotSource(dot)}
          >
            <MdOutlineRemoveRedEye className='h-5 w-5 mr-1' /> Dot
          </LinkButton>

          {isRendering && (
            <Button size='xs' type='danger' onClick={handleCancel}>
              <StopIcon className='h-5 w-5 mr-1' /> Cancel
            </Button>
          )}

          {!!isRendered && (
            <LinkButton
              size='xs'
              type='secondary'
              target='_blank'
              href={getSVG(domRef.current as HTMLElement)}
              download='graphviz.svg'
            >
              <MdDownload className='h-5 w-5 mr-1' /> SVG
            </LinkButton>
          )}

          {!!isRendered && (
            <LinkButton
              size='xs'
              type='secondary'
              target='_blank'
              href={png}
              download='graphviz.png'
            >
              <MdDownload className='h-5 w-5 mr-1' /> PNG
            </LinkButton>
          )}
        </div>
        {!!isRendered && (
          <div className='flex gap-3 text-gray-600'>
            <button
              type='button'
              className='rounded-full bg-white hover:text-gray-800 h-10 w-10 p-1'
              onClick={handleReset}
            >
              <MdYoutubeSearchedFor className='w-full h-full' />
            </button>
            <button
              type='button'
              className='rounded-full bg-white hover:text-gray-800 h-10 w-10 p-1'
              onClick={handleZoomIn}
            >
              <MdZoomIn className='w-full h-full' />
            </button>
            <button
              type='button'
              className='rounded-full bg-white hover:text-gray-800 h-10 w-10 p-1'
              onClick={handleZoomOut}
            >
              <MdZoomOut className='w-full h-full' />
            </button>
          </div>
        )}
      </div>
      <div
        data-testid='graphviz-mime'
        className='max-w-full overflow-x-auto'
        ref={domRef}
      ></div>
    </div>
  );
}

const getDotSource = (source: string) =>
  toBlobUrl(source, 'text/plain;charset=UTF-8');

const getSVG = (el: HTMLElement) => {
  const svgEl = el.querySelector('svg');

  if (!svgEl) {
    throw new Error(`Coudln't find graphviz svg element.`);
  }

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgEl);

  return toBlobUrl(source, 'image/svg+xml');
};

const getPNG = async (el: HTMLElement, width: number, height: number) => {
  const svg = getSVG(el);

  return await base64SvgToBase64Png(svg, width, height);
};

// adapted from https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f
const base64SvgToBase64Png = (
  originalBase64: string,
  width: number,
  height: number,
) => {
  return new Promise<string>(resolve => {
    const img = document.createElement('img');

    img.addEventListener('load', () => {
      const canvas = document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      try {
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/png');

        resolve(data);
      } catch {
        resolve('');
      }
    });
    img.src = originalBase64;
  });
};

// eslint doesn't think BlobPart exists, but it is part of standard browser JS
// eslint-disable-next-line no-undef
const toBlobUrl = (data: BlobPart, mime: string) => {
  const blob = new Blob([data], { type: mime });

  return window.URL.createObjectURL(blob);
};

// prefixes for top level graph attributes
const ATTRIBUTE_TYPES = ['graph', 'node', 'edge'];

export interface GraphData {
  nodes: string[];
  edges: string[];
  attrs: Map<string, string[]>;
  nodeAttrs: Map<string, string[]>;
  edgeAttrs: Map<string, string[]>;
  subgraphData: Map<string, ResultTable[]>;
  parent: string;
}

interface SubGraphData extends GraphData {
  id: string;
  subgraphs: SubGraphData[];
}

export const emptyGraph = (): GraphData => {
  const nodes: string[] = [];
  const edges: string[] = [];
  const nodeAttrs: Map<string, string[]> = new Map();
  const edgeAttrs: Map<string, string[]> = new Map();
  const attrs: Map<string, string[]> = new Map(
    ATTRIBUTE_TYPES.map(type => [type, []]),
  );
  const subgraphData: Map<string, ResultTable[]> = new Map();

  return {
    nodes,
    edges,
    attrs,
    nodeAttrs,
    edgeAttrs,
    subgraphData,
    parent: '',
  };
};

// Generate the dot format string
// Parse the nodes and edges from the input relation and format them in dot syntax
// https://en.wikipedia.org/wiki/DOT_(graph_description_language)
// https://graphviz.org/doc/info/lang.html
export const generateDot = (results: ResultTable[]) => {
  // directed and clustered values needed to parse other relation types - can be assumed to
  // be a non-overloaded relation due to the API documentation
  const directed = getValue<boolean>(results, ':directed', true);
  const clustered = getValue<boolean>(results, ':clustered', true);

  const graphType = `${directed ? 'di' : ''}graph`;

  const graphData: GraphData = getData(results, directed, clustered);

  // initialize subgraph tree and child subgraphs
  const subGraphTree: SubGraphData[] = [];
  const subGraphChildren: SubGraphData[] = [];
  const subgraphIds: string[] = [];

  graphData.subgraphData.forEach((rels, subgraphId) => {
    const relData = getData(rels, directed, clustered);

    subgraphIds.push(subgraphId);
    const subgraph = { id: subgraphId, ...relData, subgraphs: [] };

    if (relData.parent === '') {
      subGraphTree.push(subgraph);
    } else {
      subGraphChildren.push(subgraph);
    }
  });

  if (
    !subGraphChildren.every(subgraph => subgraphIds.includes(subgraph.parent))
  ) {
    throw new Error(
      '`:parent` of a subgraph must contain the id of another subgraph',
    );
  }

  buildSubGraphTree(subGraphTree, subGraphChildren);

  return buildGraph(graphData, subGraphTree, directed, graphType);
};

// find the children for every subgraph and attach them to the parent
// all subraph ids are already known to be unique and parent ids also exist, so going
// through each parent and finding all children should attach all the children to the tree
// (if there's a detached subtree/graph, this will not find it)
export const buildSubGraphTree = (
  subGraphTree: SubGraphData[],
  subGraphChildren: SubGraphData[],
): void => {
  for (const subgraph of subGraphTree) {
    const children = subGraphChildren.filter(s => s.parent == subgraph.id);

    if (children.length > 0) {
      subgraph.subgraphs = children;
      buildSubGraphTree(children, subGraphChildren);
    }
  }
};

// do the actual parsing with recursion for subgraphs
const buildGraph = (
  { nodes, edges, nodeAttrs, edgeAttrs, attrs }: GraphData,
  subgraphs: SubGraphData[],
  directed: boolean,
  graphType: string,
  id = '',
  level = 1,
) => {
  // basic validity checks
  if (nodes.length === 0 && edges.length === 0) {
    throw new Error(
      'relation passed to `Graphviz` must contain tuples prefixed with `:node` and/or `:edge`',
    );
  }

  // recurse on subgraphs
  let subgraphDot = '';

  subgraphs.forEach(({ subgraphs: children, id, ...data }) => {
    subgraphDot +=
      buildGraph(data, children, directed, 'subgraph', id, level + 1) + '\n';
  });

  // convert to dot format strings
  const nodesDot = getAttrDot(nodes, nodeAttrs, level);
  const edgesDot = getAttrDot(edges, edgeAttrs, level);
  const nonEmptyAttrs = ATTRIBUTE_TYPES.filter(
    type => attrs.get(type)?.length !== 0,
  );
  const attrDot = getAttrDot(nonEmptyAttrs, attrs, level);
  const indent = '  '.repeat(level - 1);

  return `${indent}${graphType} ${id} {${attrDot}${subgraphDot}${nodesDot}${edgesDot}${indent}}`;
};

// parse reldicts into GraphData
export const getData = (
  results: ResultTable[],
  directed: boolean,
  clustered: boolean,
): GraphData => {
  const graphData = emptyGraph();

  for (const res of results) {
    const typeDefs = res.typeDefs();
    const firstKey = typeDefs[0].type === 'Constant' && typeDefs[0].value.value;

    switch (firstKey) {
      case ':node':
        appendNodeData(graphData.nodes, res);
        break;
      case ':edge':
        appendEdgeData(graphData.edges, res, directed);
        break;
      case ':node_attribute':
        appendNodeAttrData(graphData.nodeAttrs, res);
        break;
      case ':edge_attribute':
        appendEdgeAttrData(graphData.edgeAttrs, res, directed);
        break;
      case ':attribute':
        appendAttrData(graphData.attrs, res);
        break;
      case ':subgraph':
        appendSubgraphData(graphData.subgraphData, res, clustered);
        break;

      case ':parent': {
        arityCheck(res, 1, ':parent');

        const parent = res.columnAt(1).get(0);

        if (parent) {
          graphData.parent = clusteredEscape(parent, clustered);
        }

        break;
      }
    }
  }

  return graphData;
};

// get a scalar value from the return relations, return default if not found
export const getValue = <T extends Value>(
  results: ResultTable[],
  key: string,
  defaultValue: T,
): T => {
  const res = results.find(rt => {
    const typeDef = rt.typeDefs()[0];

    return typeDef?.type === 'Constant' && typeDef?.value.value === key;
  });

  if (res) {
    arityCheck(res, 1, key);

    return res.columnAt(1).get(0) as T;
  } else {
    return defaultValue;
  }
};

// escape values (node ids, attribute values)
const escape = (val: Value): string => {
  if (typeof val === 'bigint') {
    return val.toString();
  }

  return JSON.stringify(val);
};

// escape and add clustered prefix
const clusteredEscape = (val: Value, clustered: boolean) =>
  escape(`${clustered ? 'cluster_' : ''}${val}`);

// construct an edge id ("from -- to")
const getEdgeId = (from: Value, to: Value, directed: boolean) => {
  return `${escape(from)} -${directed ? '>' : '-'} ${escape(to)}`;
};

// construct an attribute definition ("key = value")
const getAttrDef = (key: Value, value: Value) => `${key}=${escape(value)}`;

// update/insert array into map
const upsertMap = <T,>(map: Map<string, T[]>, id: string, value: T) => {
  // hack to get around missing flow analysis for if has then get
  const currentDef = map.get(id);

  if (currentDef) {
    currentDef.push(value);
  } else {
    map.set(id, [value]);
  }
};

// update the given attribute map to start or add to an array of attribute definitions
const updateAttrMap = (
  map: Map<string, string[]>,
  id: string,
  key: Value,
  value: Value,
) => {
  const attrDef = getAttrDef(key, value);

  upsertMap(map, id, attrDef);
};

// construct the dot with attributes for an identifier
const getAttrDot = (
  ids: string[],
  attrMap: Map<string, string[]>,
  level: number,
) => {
  return (
    ids
      .map(id => {
        const attrs = attrMap.get(id);

        if (attrs) {
          return `${'  '.repeat(level)}${id} [${attrs.join(' ')}];`;
        } else {
          return `${'  '.repeat(level)}${id};`;
        }
      })
      .join('\n') + '\n'
  );
};

const arityCheck = (resultTable: ResultTable, arity: number, type: string) => {
  const physical = resultTable.physical();

  if (physical.columnLength !== arity) {
    throw new Error(
      `\`${type}\` expects values with arity ${arity}, received: ${physical.columnLength}`,
    );
  }

  if (physical.length === 0) {
    throw new Error(`received \`${type}\` with no values`);
  }
};

// ======= get and append data to variable for each type of relation ======
// (nodeId)
const appendNodeData = (nodes: string[], resultTable: ResultTable) => {
  arityCheck(resultTable, 1, ':node');

  nodes.push(...resultTable.columnAt(1).values().map(escape));
};

// (srcNodeId, tgtNodeId)
const appendEdgeData = (
  edges: string[],
  resultTable: ResultTable,
  directed: boolean,
) => {
  arityCheck(resultTable, 2, ':edge');

  resultTable.values().forEach(row => {
    edges.push(getEdgeId(row[1], row[2], directed));
  });
};

// (nodeId, attrKey, attrValue)
const appendNodeAttrData = (
  nodeAttrs: Map<string, string[]>,
  resultTable: ResultTable,
) => {
  arityCheck(resultTable, 3, ':node_attribute');

  resultTable.values().forEach(row => {
    const nodeId = escape(row[1]);

    updateAttrMap(nodeAttrs, nodeId, row[2], row[3]);
  });
};

// (srcNodeId, tgtNodeId, attrKey, attrValue)
const appendEdgeAttrData = (
  edgeAttrs: Map<string, string[]>,
  resultTable: ResultTable,
  directed: boolean,
) => {
  arityCheck(resultTable, 4, ':edge_attribute');

  resultTable.values().forEach(row => {
    const edgeId = getEdgeId(row[1], row[2], directed);

    updateAttrMap(edgeAttrs, edgeId, row[3], row[4]);
  });
};

// second key of :graph, :node, or :edge, (attrKey, attrValue)
const appendAttrData = (
  attrs: Map<string, string[]>,
  resultTable: ResultTable,
) => {
  arityCheck(resultTable, 2, `:attribute`);

  const typeDef = resultTable.typeDefs()[1];
  const type = (typeDef?.type === 'Constant' && typeDef?.value.type === 'String'
    ? typeDef.value.value
    : ''
  ).slice(1);

  if (!ATTRIBUTE_TYPES.includes(type)) {
    throw new Error(
      '`:attribute` must contain one of `:graph`, `:edge`, `:node`',
    );
  }

  resultTable.values().forEach(row => {
    updateAttrMap(attrs, type, row[2], row[3]);
  });
};

// :subgraph, <id>, ...
const appendSubgraphData = (
  subgraphData: Map<string, ResultTable[]>,
  resultTable: ResultTable,
  clustered: boolean,
) => {
  if (resultTable.columnLength < 4) {
    throw new Error('received `:subgraph` with no values');
  }

  let lastStart = 0;

  const values = resultTable.columnAt(1).values();

  for (let i = 0; i < values.length; i++) {
    const id = values[i];
    const nextId = values[i + 1];

    if (id !== nextId) {
      const newTable = resultTable.sliceColumns(2).slice(lastStart, i + 1);

      upsertMap(subgraphData, clusteredEscape(id, clustered), newTable);
      lastStart = i + 1;
    }
  }
};
