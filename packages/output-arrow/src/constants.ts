export const MimeTypeRegExMap = {
  // values are taken from /:text/:html/* relations
  HTML: /^text\/html/,

  // values are taken from /:text/:markdown/* relations
  MARKDOWN: /^text\/markdown/,

  // values are taken from /:image/:svg/* relations
  SVG: /^image\/svg\+xml/,

  // values are taken from /:image/* relations
  IMAGE: /^image\//,

  // values are taken from /:json/:data/* relations
  JSON: /^application\/vnd\.rel\.relation\.json/,

  // values are taken from /:table/:data/* relations
  TABLE: /^application\/vnd\.rel\.relation\.table/,

  // values are taken from /:plot/:vega/* or /:plot/:vegalite/* relations
  VEGA: /^application\/vnd\.rel\.relation\.plot\.vega/,

  // values are taken from /:graph/:data/* relations
  GRAPHVIZ: /^application\/vnd\.rel\.relation\.graph\.graphviz/,
};

export const MAIN_OUTPUT = 'output';
