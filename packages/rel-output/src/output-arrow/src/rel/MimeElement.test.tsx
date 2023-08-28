import { render, screen, waitFor } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { MimeElement } from './MimeElement';

describe('MimeElement', () => {
  it('should display html mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['text/html']],
      },
      {
        relationId: '/:text/:html/String',
        columns: [['<div>foo</div>']],
      },
    ]);

    render(<MimeElement relations={relations} mimeType='text/html' />);

    expect(screen.getByTestId('html-mime')).toBeInTheDocument();
  });

  it('should display image mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['image/png']],
      },
      {
        relationId: '/:image/String',
        columns: [['data:image/png;base64.ooops>']],
      },
    ]);

    render(<MimeElement relations={relations} mimeType='image/' />);

    expect(screen.getByTestId('img-mime')).toBeInTheDocument();
  });

  it('should display markdown mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['text/markdown']],
      },
      {
        relationId: '/:text/:markdown/String',
        columns: [['# Foo']],
      },
    ]);

    render(<MimeElement relations={relations} mimeType='text/markdown' />);

    expect(screen.getByTestId('markdown-mime')).toBeInTheDocument();
  });

  it('should display svg mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['image/svg+xml']],
      },
      {
        relationId: '/:image/:svg/String',
        columns: [['<svg></svg>']],
      },
    ]);

    render(<MimeElement relations={relations} mimeType='image/svg+xml' />);

    expect(screen.getByTestId('svg-mime')).toBeInTheDocument();
  });

  it('should display json mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.json']],
      },
      {
        relationId: '/:json/:data/:foo/String',
        columns: [['bar']],
      },
    ]);

    render(
      <MimeElement
        relations={relations}
        mimeType='application/vnd.rel.relation.json'
      />,
    );

    expect(screen.getByTestId('json-mime')).toBeInTheDocument();
  });

  it('should display table mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.table']],
      },
      {
        relationId: '/:table/:data/:foo/Int64/String',
        columns: [
          [1, 2],
          ['bar', 'baz'],
        ],
      },
    ]);

    render(
      <MimeElement
        relations={relations}
        mimeType='application/vnd.rel.relation.table'
      />,
    );

    expect(screen.getByTestId('table-mime')).toBeInTheDocument();
  });

  it('should display vega mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.plot.vegalite.v5']],
      },
      { relationId: '/:plot/:vegalite/:mark/String', columns: [['bar']] },
      {
        relationId: '/:plot/:vegalite/:data/:[]/Int64/:a/String',
        columns: [
          [1, 2],
          ['A', 'B'],
        ],
      },
      {
        relationId: '/:plot/:vegalite/:data/:[]/Int64/:b/Int64',
        columns: [
          [1, 1],
          [2, 2],
        ],
      },
    ]);

    render(
      <MimeElement
        relations={relations}
        mimeType='application/vnd.rel.relation.plot.vega'
      />,
    );

    expect(screen.getByTestId('vega-mime')).toBeInTheDocument();
  });

  it('should display graphviz mime', async () => {
    const relations = plainToArrow([
      {
        relationId: '/:graph/:data/:node/String',
        columns: [['node']],
      },
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.graph.graphviz']],
      },
    ]);

    render(
      <MimeElement
        relations={relations}
        mimeType='application/vnd.rel.relation.graph.graphviz'
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId('graphviz-mime')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});
