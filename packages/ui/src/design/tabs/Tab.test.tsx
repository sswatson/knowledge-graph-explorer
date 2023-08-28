import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tab } from './Tab';

function TestIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      data-testid='test-icon'
      viewBox='0 0 512 512'
    ></svg>
  );
}

describe('Tab', () => {
  it('should display tab', () => {
    const { rerender } = render(
      <Tab
        id='Foo'
        current={false}
        index={0}
        Icon={TestIcon}
        onSelect={jest.fn()}
      />,
    );

    const tab = screen.getByRole('tab', { name: 'Foo' });

    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute('aria-selected', 'false');
    expect(within(tab).getByTestId('test-icon')).toBeInTheDocument();
    expect(
      within(tab).queryByRole('button', { name: 'close tab' }),
    ).not.toBeInTheDocument();

    rerender(
      <Tab
        id='Foo'
        current={true}
        index={0}
        Icon={TestIcon}
        onSelect={jest.fn()}
      />,
    );

    expect(tab).toHaveAttribute('aria-selected', 'true');

    rerender(
      <Tab
        id='Foo'
        current={true}
        index={0}
        Icon={TestIcon}
        onSelect={jest.fn()}
        isPending
      />,
    );

    expect(screen.getByTestId('Foo-tab-pending')).toBeInTheDocument();
  });

  it('should select tab', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    render(<Tab id='Foo' current={false} index={0} onSelect={mockOnSelect} />);

    await user.click(screen.getByRole('tab'));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);

    await user.keyboard('{Enter}');
    expect(mockOnSelect).toHaveBeenCalledTimes(2);
  });

  it('should close tab', () => {
    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <Tab
        id='Foo'
        current={false}
        index={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    fireEvent.click(screen.getByTestId('close tab'));

    expect(mockOnSelect).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close tab via middle click', async () => {
    userEvent.setup();

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <Tab
        id='Foo'
        current={false}
        index={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    fireEvent.mouseUp(screen.getByRole('tab'), { button: 1 });

    expect(mockOnSelect).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close tab', () => {
    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <Tab
        id='Foo'
        current={false}
        index={0}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    fireEvent.click(screen.getByTestId('close tab'));

    expect(mockOnSelect).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    'should control context menu using with onRename(%p) and onClose(%p)',
    async (onRename, onClose) => {
      const onRenameMock = onRename ? jest.fn() : undefined;
      const onCloseMock = onClose ? jest.fn() : undefined;

      render(
        <Tab
          id='Foo'
          current={false}
          index={0}
          onSelect={jest.fn()}
          onClose={onCloseMock}
          onRename={onRenameMock}
        />,
      );
      fireEvent.contextMenu(screen.getByRole('tab'));

      if (onRename || onClose) {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      } else {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      }

      if (onClose) {
        fireEvent.click(screen.getByRole('menuitem', { name: 'Close' }));
        expect(onCloseMock).toHaveBeenCalled();
        fireEvent.contextMenu(screen.getByRole('tab'));
      } else {
        expect(
          screen.queryByRole('menuitem', { name: 'Close' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('close tab')).not.toBeInTheDocument();
      }

      if (onRename) {
        fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
        expect(onRenameMock).toHaveBeenCalled();
      } else {
        expect(
          screen.queryByRole('menuitem', { name: 'Rename' }),
        ).not.toBeInTheDocument();
      }
    },
  );
});
