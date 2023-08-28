import { render, screen, waitFor, within } from '@testing-library/react';

import { ResultTable } from '@relationalai/rai-sdk-javascript/web';
import { plainToArrow } from '@relationalai/utils';

import { LogicalOutput } from './LogicalOutput';

describe('LogicalOutput', () => {
  it('should display relations', async () => {
    const relations = plainToArrow([
      { relationId: '/:bar/:baz/Int64', columns: [[1, 2]] },
      { relationId: '/:bar/String', columns: [['a', 'b']] },
      { relationId: '/:bar/String/Int64/Char', columns: [['d'], [65], [65]] },
    ]);

    render(<LogicalOutput relations={relations} />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('#');
    expect(screen.getAllByRole('columnheader')[1]).toHaveTextContent('Symbol');
    expect(screen.getAllByRole('columnheader')[2]).toHaveTextContent('Mixed');
    expect(screen.getAllByRole('columnheader')[3]).toHaveTextContent('Int64');
    expect(screen.getAllByRole('columnheader')[4]).toHaveTextContent('Char');

    const rowGroup = screen.getAllByRole('rowgroup')[2];

    await waitFor(() =>
      expect(within(rowGroup).getAllByRole('row')[0]).toHaveTextContent(
        ':bar:baz1',
      ),
    );
    expect(within(rowGroup).getAllByRole('row')[1]).toHaveTextContent(
      ':bar:baz2',
    );
    expect(within(rowGroup).getAllByRole('row')[2]).toHaveTextContent(':bara');
    expect(within(rowGroup).getAllByRole('row')[3]).toHaveTextContent(':barb');
    expect(within(rowGroup).getAllByRole('row')[4]).toHaveTextContent(
      `:bard65A`,
    );
  });

  it('should handle result table as input', async () => {
    const relations = plainToArrow([
      { relationId: '/:bar/:baz/Int64', columns: [[1, 2]] },
      { relationId: '/:bar/String', columns: [['a', 'b']] },
    ]).map(r => new ResultTable(r));

    render(<LogicalOutput relations={relations} />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('#');
    expect(screen.getAllByRole('columnheader')[1]).toHaveTextContent('Symbol');
    expect(screen.getAllByRole('columnheader')[2]).toHaveTextContent('Mixed');
    expect(screen.getAllByRole('columnheader')[3]).toHaveTextContent('Int64');

    const rowGroup = screen.getAllByRole('rowgroup')[2];

    await waitFor(() =>
      expect(within(rowGroup).getAllByRole('row')[0]).toHaveTextContent(
        ':bar:baz1',
      ),
    );
    expect(within(rowGroup).getAllByRole('row')[1]).toHaveTextContent(
      ':bar:baz2',
    );
    expect(within(rowGroup).getAllByRole('row')[2]).toHaveTextContent(':bara');
    expect(within(rowGroup).getAllByRole('row')[3]).toHaveTextContent(':barb');
  });
});
