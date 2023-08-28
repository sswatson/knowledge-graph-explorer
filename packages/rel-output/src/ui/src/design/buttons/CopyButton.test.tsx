import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { copyToClipboard } from '@relationalai/utils';

import { CopyButton } from './CopyButton';

jest.mock('@relationalai/utils');

const copyToClipboardMock = jest.mocked(copyToClipboard);
const waitForFloating = () => act(async () => {});

describe('CopyButton', () => {
  it('should copy and show tooltip', async () => {
    const user = userEvent.setup();
    const mockOnCopyToClipboard = jest.fn();

    copyToClipboardMock.mockImplementation(mockOnCopyToClipboard);

    render(<CopyButton onCopy={() => 'test-value'} />);

    expect(screen.queryByText('Copy')).not.toBeInTheDocument();

    const element = screen.getByTestId('copy-button');

    await act(async () => await user.hover(element));

    expect(await screen.findByText('Copy')).toBeInTheDocument();

    await act(async () => await user.click(element));

    expect(await screen.findByText('Copied!')).toBeInTheDocument();

    await act(async () => await user.unhover(element));

    await waitFor(() => {
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });

    await act(async () => await user.hover(element));

    expect(await screen.findByText('Copy')).toBeInTheDocument();
    await waitForFloating();
  });
});
