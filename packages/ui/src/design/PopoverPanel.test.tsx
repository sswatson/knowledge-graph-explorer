import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PopoverPanel } from './PopoverPanel';

const waitForFloating = () => act(async () => {});

describe('PopoverPanel', () => {
  it('should show popover panel', async () => {
    render(
      <PopoverPanel panel={<div>panel</div>} trigger={<div>trigger</div>} />,
    );

    await waitForFloating();

    const triggerEl = screen.getByText('trigger');

    expect(screen.queryByTestId('popover-panel')).not.toBeInTheDocument();

    await act(() => {
      fireEvent.click(triggerEl);
    });

    expect(screen.getByText('panel')).toBeVisible();
  });

  it('should keep panel mounted', async () => {
    const user = userEvent.setup();

    render(
      <PopoverPanel
        panel={<div>panel</div>}
        trigger={<div>trigger</div>}
        unmount={false}
      />,
    );

    await waitForFloating();

    const triggerEl = screen.getByText('trigger');

    expect(screen.queryByTestId('popover-panel')).not.toBeVisible();

    await act(async () => {
      await user.click(triggerEl);
    });

    expect(screen.getByText('panel')).toBeVisible();
  });
});
