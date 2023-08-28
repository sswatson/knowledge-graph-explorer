import { fireEvent, render, screen, within } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { groupRelations } from '../../outputUtils';
import { PartitionedVerticalMode } from './PartitionedVerticalMode';

const relations = groupRelations(
  plainToArrow([
    { relationId: '/String/Int64/Char', columns: [['d'], [65], [65]] },
    { relationId: '/:baz/Int64', columns: [[1, 2]] },
    { relationId: '/:bar/String', columns: [['a', 'b']] },
    { relationId: '/:bar/String', columns: [['c', 'd']] },
  ]),
);
const groups = ['output', ':baz', ':bar'];

describe('PartitionedVerticalMode', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should show relations with side menu', () => {
    render(<PartitionedVerticalMode groupedRelations={relations} />);

    expect(
      screen.getByTestId('partitioned-vertical-mode-output'),
    ).toBeInTheDocument();
    const sideMenu = screen.getByTestId('partitioned-vertical-mode-side-menu');

    groups.forEach(group => {
      expect(within(sideMenu).getByText(group)).toBeInTheDocument();
    });
  });

  it('should not render when no relations', () => {
    render(<PartitionedVerticalMode groupedRelations={{}} />);
    expect(
      screen.queryByTestId('partitioned-vertical-mode'),
    ).not.toBeInTheDocument();
  });

  it('should scroll into output related to menu item when click', () => {
    render(<PartitionedVerticalMode groupedRelations={relations} />);
    const outputContainer = screen.getByTestId(
      'partitioned-vertical-mode-output',
    );
    const sideMenu = screen.getByTestId('partitioned-vertical-mode-side-menu');

    expect(sideMenu.children[0]).toHaveClass('bg-red-orange-100');

    outputContainer.children[1].scrollIntoView = jest.fn();

    fireEvent.click(within(sideMenu).getByText(groups[1]));

    expect(outputContainer.children[1].scrollIntoView).toHaveBeenCalled();
    expect(sideMenu.children[1]).toHaveClass('bg-red-orange-100');
    expect(sideMenu.children[0]).not.toHaveClass('bg-red-orange-100');
  });
});
