import { dimension } from '@shopify/jest-dom-mocks';
import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import Table from './Table';

describe('TableRelation', () => {
  beforeEach(() => {
    dimension.mock({
      offsetWidth: 500,
      offsetHeight: 500,
    });
  });

  afterEach(() => {
    dimension.restore();
  });

  it('should render mime table', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.table']],
      },
      {
        relationId: '/:table/:data/:id/Int64/String',
        columns: [
          [1, 2],
          ['id1', 'id2'],
        ],
      },
      {
        relationId: '/:table/:data/:name/Int64/String',
        columns: [
          [1, 2],
          ['name1', 'name2'],
        ],
      },
    ]);

    render(<Table relations={relations} />);

    const headers = screen.getAllByRole('columnheader');

    expect(headers[0]).toHaveTextContent('');
    expect(headers[1]).toHaveTextContent(':id');
    expect(headers[2]).toHaveTextContent(':name');

    const cells = screen.getAllByRole('gridcell');

    expect(cells[0]).toHaveTextContent('1');
    expect(cells[1]).toHaveTextContent('id1');
    expect(cells[2]).toHaveTextContent('name1');
    expect(cells[3]).toHaveTextContent('2');
    expect(cells[4]).toHaveTextContent('id2');
    expect(cells[5]).toHaveTextContent('name2');
  });

  it('should render warning for single column physical relation', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.table']],
      },
      { relationId: '/:table/:data/Int64', columns: [[1, 2, 3]] },
    ]);

    render(<Table relations={relations} />);

    const alerts = screen.getAllByRole('alert');

    expect(alerts[0]).toHaveTextContent(
      'Cannot build table: Skipping Relation /Int64: table display currently does not support arity-1 input relations.',
    );
  });

  it('should render true as check icon', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.table']],
      },
      { relationId: '/:table/:data/:flag/Int64', columns: [[2]] },
      {
        relationId: '/:table/:data/:name/Int64/String',
        columns: [
          [1, 2],
          ['foo', 'bar'],
        ],
      },
    ]);

    render(<Table relations={relations} />);

    const headers = screen.getAllByRole('columnheader');

    expect(headers[0]).toHaveTextContent('');
    expect(headers[1]).toHaveTextContent(':flag');
    expect(headers[2]).toHaveTextContent(':name');

    const cells = screen.getAllByRole('gridcell');

    expect(cells[0]).toHaveTextContent('2');
    expect(cells[1]).toHaveTextContent('true');
    expect(cells[2]).toHaveTextContent('bar');
    expect(cells[3]).toHaveTextContent('1');
    expect(cells[4]).toHaveTextContent('');
    expect(cells[5]).toHaveTextContent('foo');
  });
});
