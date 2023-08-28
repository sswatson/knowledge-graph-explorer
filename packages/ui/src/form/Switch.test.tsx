import { fireEvent, render, screen } from '@testing-library/react';

import { PureSwitch } from './Switch';

describe('Switch', () => {
  describe('PureSwitch', () => {
    it('should switch', () => {
      const mockOnChange = jest.fn();

      const { rerender } = render(
        <PureSwitch value={true} onChange={mockOnChange} />,
      );

      fireEvent.click(screen.getByRole('switch'));

      expect(screen.getByRole('switch')).toHaveTextContent('ON');

      expect(mockOnChange).toHaveBeenNthCalledWith(1, false);

      rerender(<PureSwitch value={false} onChange={mockOnChange} />);

      expect(screen.getByRole('switch')).toHaveTextContent('OFF');

      fireEvent.click(screen.getByRole('switch'));

      expect(mockOnChange).toHaveBeenNthCalledWith(2, true);
    });
  });
});
