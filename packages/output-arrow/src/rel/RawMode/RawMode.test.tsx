import { fireEvent, render, screen, within } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { RawMode } from './RawMode';

describe('RawMode', () => {
  it('should sort relations', () => {
    const relations = plainToArrow([
      { relationId: '/:foo/Int32', columns: [[1, 2, 3]] },
      { relationId: '/:bar/String', columns: [['a', 'b', 'c']] },
    ]);

    render(<RawMode relations={relations} />);

    fireEvent.click(screen.getByText(':foo'));

    expect(
      within(screen.getAllByRole('treegrid')[0]).getAllByRole(
        'columnheader',
      )[0],
    ).toHaveTextContent('v1');

    expect(
      within(screen.getAllByRole('treegrid')[1]).getAllByRole(
        'columnheader',
      )[0],
    ).toHaveTextContent('v1');
  });

  it('should collapse/uncollapse relations', () => {
    const relations = plainToArrow([
      { relationId: '/:foo/Int32', columns: [[1, 2, 3]] },
      { relationId: '/:bar/String', columns: [['a', 'b', 'c']] },
    ]);

    render(<RawMode relations={relations} />);

    expect(screen.getAllByRole('treegrid').length).toEqual(1);

    fireEvent.click(screen.getByText(':foo'));

    expect(screen.getAllByRole('treegrid').length).toEqual(2);

    fireEvent.click(screen.getByText(':bar'));

    expect(screen.getAllByRole('treegrid').length).toEqual(1);
  });
});
