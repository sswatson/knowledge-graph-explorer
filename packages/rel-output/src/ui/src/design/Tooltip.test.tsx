import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('should show tooltip', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip text='tooltip'>
        <div>foo</div>
      </Tooltip>,
    );

    const fooEl = screen.getByText('foo');

    expect(screen.queryByText('tooltip')).not.toBeInTheDocument();

    await act(async () => {
      await user.hover(fooEl);
    });

    await waitFor(() => {
      expect(screen.getByText('tooltip')).toBeInTheDocument();
    });

    await act(async () => {
      await user.unhover(fooEl);
    });

    await waitFor(() => {
      expect(screen.queryByText('tooltip')).not.toBeInTheDocument();
    });
  });
});
