import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';

import { ContextMenu } from './ContextMenu';

describe('ContextMenu', () => {
  it('should display context menu', () => {
    const mockOnOpen = jest.fn();

    function TestComponent() {
      return (
        <ContextMenu menu={<div>My Menu</div>} onOpen={mockOnOpen}>
          <div>Test Element</div>
        </ContextMenu>
      );
    }

    render(<TestComponent />);

    expect(screen.queryByText('My Menu')).not.toBeInTheDocument();
    expect(mockOnOpen).not.toHaveBeenCalled();

    fireEvent.contextMenu(screen.getByText('Test Element'));

    expect(screen.queryByText('My Menu')).toBeInTheDocument();
    expect(screen.queryByTestId('context-menu')).toBeInTheDocument();
    expect(mockOnOpen).toHaveBeenCalled();
  });

  it('should display context menu via trigger element', () => {
    const mockOnOpen = jest.fn();

    function TestComponent() {
      const triggerRef = useRef(null);

      return (
        <div>
          <button ref={triggerRef}>open</button>
          <ContextMenu
            triggerRef={triggerRef}
            menu={<div>My Menu</div>}
            onOpen={mockOnOpen}
          >
            <div>Test Element</div>
          </ContextMenu>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.queryByText('My Menu')).not.toBeInTheDocument();
    expect(mockOnOpen).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('My Menu')).toBeInTheDocument();
    expect(screen.queryByTestId('context-menu')).toBeInTheDocument();
    expect(mockOnOpen).toHaveBeenCalled();
  });

  it('should hide context menu', () => {
    const mockOnClose = jest.fn();

    function TestComponent() {
      return (
        <div>
          <ContextMenu menu={<div>My Menu</div>} onClose={mockOnClose}>
            <div>Test Element</div>
          </ContextMenu>
          <div>Something else</div>
        </div>
      );
    }

    render(<TestComponent />);

    fireEvent.contextMenu(screen.getByText('Test Element'));

    expect(screen.queryByText('My Menu')).toBeInTheDocument();
    expect(screen.queryByTestId('context-menu')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByText('Something else'));

    expect(screen.queryByText('My Menu')).not.toBeInTheDocument();
    expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
