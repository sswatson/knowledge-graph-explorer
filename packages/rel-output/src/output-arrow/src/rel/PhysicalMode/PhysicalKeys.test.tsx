import { render, screen } from '@testing-library/react';

import { PhysicalKeys } from './PhysicalKeys';

describe('PhysicalKeys', () => {
  it('should display keys', () => {
    render(<PhysicalKeys relationId='/:foo/String/:bar/Int64' />);

    expect(screen.getByText(':foo')).toBeInTheDocument();
    expect(screen.getByText(':foo')).toHaveClass('font-bold');
    expect(screen.getByText('String')).toBeInTheDocument();
    expect(screen.getByText(':bar')).toBeInTheDocument();
    expect(screen.getByText(':bar')).toHaveClass('font-bold');
    expect(screen.getByText('Int64')).toBeInTheDocument();
    expect(screen.getAllByText('/').length).toEqual(4);
  });
});
