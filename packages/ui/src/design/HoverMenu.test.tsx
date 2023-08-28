import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';

import { HoverMenu } from './HoverMenu';

describe('HoverMenu', () => {
  function TestComponent() {
    const ref = useRef<HTMLDivElement>(null);

    return (
      <div data-testid='test-cmp' ref={ref}>
        Foo
        <HoverMenu triggerRef={ref}>Inside Menu</HoverMenu>
      </div>
    );
  }

  it('should display hover menu', async () => {
    render(<TestComponent />);

    expect(screen.queryByText('Inside Menu')).not.toBeInTheDocument();

    fireEvent.pointerEnter(screen.getByTestId('test-cmp'));

    expect(screen.queryByText('Inside Menu')).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByTestId('test-cmp'));

    await waitFor(() => {
      expect(screen.queryByText('Inside Menu')).not.toBeInTheDocument();
    });
  });
});
