import { render, screen } from '@testing-library/react';

import { Badge } from './Badge';

describe('Badge', () => {
  it('should display children', () => {
    render(
      <Badge>
        <div data-testid='test-badge'>Badge Value</div>
      </Badge>,
    );

    expect(screen.getByTestId('test-badge')).toBeInTheDocument();
    expect(screen.getByText('Badge Value')).toBeInTheDocument();
  });

  it('should color badge', () => {
    const { rerender } = render(<Badge>Badge Value</Badge>);

    const element = screen.getByText('Badge Value');

    expect(element).toHaveClass('bg-gray-100');

    rerender(<Badge color='green'>Badge Value</Badge>);

    expect(element).toHaveClass('bg-green-100');
  });
});
