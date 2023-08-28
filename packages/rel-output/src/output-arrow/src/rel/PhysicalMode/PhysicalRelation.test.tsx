import { render, screen, waitFor } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { PhysicalRelation } from './PhysicalRelation';

describe('PhysicalRelation', () => {
  it('should render relation', async () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int32/:bar/String/Char',
        columns: [
          [1, 2, 3],
          ['a', 'b', 'c'],
          [65, 66, 67],
        ],
      },
    ]);

    render(<PhysicalRelation relation={relations[0]} />);

    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Int32');
    expect(screen.getAllByRole('columnheader')[1]).toHaveTextContent('String');

    expect(screen.getAllByRole('columnheader')[2]).toHaveTextContent('Char');

    await waitFor(() =>
      expect(screen.getAllByRole('gridcell')[0]).toHaveTextContent('1'),
    );
    expect(screen.getAllByRole('gridcell')[1]).toHaveTextContent('a');
    expect(screen.getAllByRole('gridcell')[2]).toHaveTextContent('A');

    expect(screen.getAllByRole('gridcell')[3]).toHaveTextContent('2');
    expect(screen.getAllByRole('gridcell')[4]).toHaveTextContent('b');
    expect(screen.getAllByRole('gridcell')[5]).toHaveTextContent('B');

    expect(screen.getAllByRole('gridcell')[6]).toHaveTextContent('3');
    expect(screen.getAllByRole('gridcell')[7]).toHaveTextContent('c');
    expect(screen.getAllByRole('gridcell')[8]).toHaveTextContent('C');
  });

  it('should render true relation', async () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo',
        columns: [],
      },
    ]);

    render(<PhysicalRelation relation={relations[0]} />);

    expect(
      screen
        .getAllByRole('columnheader')[0]
        .querySelectorAll('.ag-header-cell-text')[0].textContent,
    ).toEqual(' ');

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell')[0]).toHaveTextContent('()');
    });
  });
});
