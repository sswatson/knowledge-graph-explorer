import { dimension } from '@shopify/jest-dom-mocks';
import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { groupRelations } from '../../outputUtils';
import { PartitionedHorizontalMode } from './PartitionedHorizontalMode';

const relations = groupRelations(
  plainToArrow([
    { relationId: '/String/Int64/Char', columns: [['d'], [65], [65]] },
    { relationId: '/:baz/Int64', columns: [[1, 2]] },
    { relationId: '/:bar/String', columns: [['a', 'b']] },
    { relationId: '/:bar/String', columns: [['c', 'd']] },
  ]),
);

describe('PartitionedHorizontalMode', () => {
  beforeEach(() => {
    dimension.mock({
      offsetWidth: 1000,
      offsetHeight: 800,
    });
  });

  afterEach(() => {
    dimension.restore();
  });

  it('should show logical mode for grouped relations', () => {
    render(<PartitionedHorizontalMode groupedRelations={relations} />);
    expect(screen.getByTestId('output-tags')).toBeInTheDocument();
    expect(screen.getByTestId('logical-output')).toBeInTheDocument();
  });

  it('should not render when no relations', () => {
    render(<PartitionedHorizontalMode groupedRelations={{}} />);
    expect(screen.queryByTestId('output-tags')).not.toBeInTheDocument();
    expect(screen.queryByTestId('logical-output')).not.toBeInTheDocument();
  });
});
