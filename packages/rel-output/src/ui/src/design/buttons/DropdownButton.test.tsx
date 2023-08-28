import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { DropdownButton } from './DropdownButton';

const waitForFloating = () => act(async () => {});

describe('Dropdown button', () => {
  it('should render two button (normal button and menu trigger)', async () => {
    const buttonItems = [
      {
        label: 'item1',
        value: false,
        tooltipText: 'tooltip 1',
      },
      {
        label: 'item2',
        value: true,
        tooltipText: 'tooltip 2',
      },
    ];

    render(
      <DropdownButton
        options={buttonItems}
        buttonTooltipText='button tooltip'
        dropdownTooltipText='dropdown tooltip'
      >
        DropdownBtn
      </DropdownButton>,
    );

    await waitForFloating();

    const buttons = screen.queryAllByRole('button');

    expect(buttons.length).toEqual(2);
    expect(buttons[0]).toHaveTextContent('DropdownBtn');

    expect(buttons[1]).toHaveAttribute(
      'data-testid',
      'dropdown-button-trigger-button',
    );
  });

  it('should run main btn action when clicking on it', async () => {
    const buttonItems = [
      {
        label: 'item1',
        value: 'item1',
        tooltipText: 'tooltip 1',
      },
      {
        label: 'item2',
        value: 'item2',
        tooltipText: 'tooltip 2',
      },
    ];

    const onClick = jest.fn();

    render(
      <DropdownButton
        onClick={onClick}
        options={buttonItems}
        buttonTooltipText='button tooltip'
        dropdownTooltipText='dropdown tooltip'
      >
        DropdownBtn
      </DropdownButton>,
    );

    await waitForFloating();

    const mainButton = screen.getByRole('button', { name: 'DropdownBtn' });

    fireEvent.click(mainButton);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(mainButton);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('should show dropdown button items', async () => {
    const buttonItems = [
      {
        label: 'item1',
        value: 'item1',
        tooltipText: 'tooltip 1',
      },
      {
        label: 'item2',
        value: 'item2',
        tooltipText: 'tooltip 2',
      },
    ];

    render(
      <DropdownButton
        options={buttonItems}
        buttonTooltipText='button tooltip'
        dropdownTooltipText='dropdown tooltip'
      >
        DropdownBtn
      </DropdownButton>,
    );

    expect(screen.queryAllByRole('option').length).toEqual(0);

    await act(() => {
      fireEvent.click(screen.getByTestId('dropdown-button-trigger-button'));
    });

    await waitFor(() => {
      expect(screen.queryAllByRole('option')[0]).toBeInTheDocument();
    });
    expect(screen.queryAllByRole('option').length).toEqual(2);
  });

  it('should disabled both button when disabled is true', async () => {
    const buttonItems = [
      {
        label: 'item1',
        value: 'item1',
        tooltipText: 'tooltip 1',
      },
      {
        label: 'item2',
        value: 'item2',
        tooltipText: 'tooltip 2',
      },
    ];

    render(
      <DropdownButton
        disabled={true}
        options={buttonItems}
        buttonTooltipText='button tooltip'
        dropdownTooltipText='dropdown tooltip'
      >
        DropdownBtn
      </DropdownButton>,
    );

    await waitForFloating();

    const mainButton = screen.getByRole('button', { name: 'DropdownBtn' });
    const dropdownTrigger = screen.getByTestId(
      'dropdown-button-trigger-button',
    );

    expect(mainButton).toBeDisabled();
    expect(dropdownTrigger).toBeDisabled();
  });
});
