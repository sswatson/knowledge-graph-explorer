import { render, screen, within } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { groupRelations } from '../../outputUtils';
import PartitionedVerticalOutput from './PartitionedVerticalOutput';

const relations = groupRelations(
  plainToArrow([
    { relationId: '/String/Int64/Char', columns: [['d'], [65], [65]] },
    { relationId: '/:baz/Int64', columns: [[1, 2]] },
    { relationId: '/:bar/String', columns: [['a', 'b']] },
    { relationId: '/:bar/String', columns: [['c', 'd']] },
  ]),
);
const groups = Object.keys(relations);

describe('PartitionedVerticalOutput', () => {
  it('should render grouped relations', () => {
    render(<PartitionedVerticalOutput groupedRelations={relations} />);
    expect(
      screen.getByTestId('partitioned-vertical-mode-output'),
    ).toBeInTheDocument();
    groups.forEach(group => {
      expect(
        within(
          screen.getByTestId('partitioned-vertical-mode-output'),
        ).getByText(group),
      );
    });
    expect(screen.getAllByTestId('logical-output')).toHaveLength(groups.length);
  });
});
