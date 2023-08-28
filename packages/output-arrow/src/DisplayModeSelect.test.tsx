import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DisplayMode } from './DisplayMode';
import { DisplayModeOption, DisplayModeSelect } from './DisplayModeSelect';

const waitForFloating = () => act(async () => {});

describe('DisplayModeSelect', () => {
  it('it should render DisplayModeSelect', async () => {
    render(
      <DisplayModeSelect mode={DisplayMode.LOGICAL} onModeChange={jest.fn()} />,
    );

    await waitForFloating();

    expect(
      screen.getByTestId('display-mode-trigger-button'),
    ).toBeInTheDocument();
    expect(screen.getByText('Logical')).toBeInTheDocument();
  });

  it('it should handle change in display mode', async () => {
    const user = userEvent.setup();
    const mockOnModeChange = jest.fn();

    render(
      <DisplayModeSelect
        mode={DisplayMode.LOGICAL}
        onModeChange={mockOnModeChange}
      />,
    );

    await act(async () => {
      await user.click(screen.getByTestId('display-mode-trigger-button'));
    });

    expect(screen.getByTestId('dropdown-item-Raw')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId('dropdown-item-Raw'));
    });

    expect(mockOnModeChange).toHaveBeenCalledWith(DisplayMode.RAW);
  });

  it('should has tooltip', async () => {
    render(
      <DisplayModeSelect mode={DisplayMode.LOGICAL} onModeChange={jest.fn()} />,
    );

    fireEvent.mouseEnter(screen.getByTestId('display-mode-select-trigger'));

    await waitFor(() => {
      expect(screen.getByText('Display mode')).toBeInTheDocument();
    });
    await waitForFloating();
  });

  it('it should use custom list of options', async () => {
    const user = userEvent.setup();
    const customOptions: DisplayModeOption[] = [
      {
        label: 'Logical',
        value: DisplayMode.LOGICAL,
      },
      {
        label: 'Physical',
        value: DisplayMode.PHYSICAL,
      },
      {
        label: 'Raw',
        value: DisplayMode.RAW,
      },
      {
        label: 'Partitioned (Horizontal)',
        value: DisplayMode.PARTITIONED_HORIZONTAL,
      },
    ];

    render(
      <DisplayModeSelect
        mode={DisplayMode.LOGICAL}
        onModeChange={jest.fn()}
        options={customOptions}
      />,
    );

    await act(async () => {
      await user.click(screen.getByTestId('display-mode-trigger-button'));
    });

    // the first Logical text is in trigger button
    expect(screen.getAllByText('Logical')[1]).toBeInTheDocument();
    expect(screen.getByText('Physical')).toBeInTheDocument();
    expect(screen.getByText('Raw')).toBeInTheDocument();
    expect(screen.getByText('Partitioned (Horizontal)')).toBeInTheDocument();
    expect(
      screen.queryByText('Partitioned (Vertical)'),
    ).not.toBeInTheDocument();
  });
});
