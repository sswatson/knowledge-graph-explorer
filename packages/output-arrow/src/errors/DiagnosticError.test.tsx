import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { copyToClipboard, Diagnostic } from '@relationalai/utils';

import { DiagnosticError } from './DiagnosticError';

jest.mock('@relationalai/utils');

const copyToClipboardMock = jest.mocked(copyToClipboard);

describe('DiagnosticError', () => {
  const diagnostic: Diagnostic = {
    code: 'DIAGNOSTIC_CODE_FOO_BAR',
    severity: 'exception',
    message: 'diagnostic_message',
    model: 'diagnostic_model',
    report: 'diagnostic_report',
    range: [
      {
        start: { line: 2, character: 4 },
        end: { line: 2, character: 10 },
      },
    ],
  };

  it('should display diagnostic fields and txn id', () => {
    render(<DiagnosticError diagnostic={diagnostic} transactionId='txn_id' />);

    expect(screen.getByText('DIAGNOSTIC CODE FOO BAR:')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://docs.relational.ai/error-code/diagnostic-code-foo-bar',
    );
    expect(screen.getByText('(line: 2, character: 4)')).toBeInTheDocument();
    expect(screen.getByTestId('error-feedback')).toBeInTheDocument();
  });

  it('should copy diagnostics to clipboard', () => {
    render(<DiagnosticError diagnostic={diagnostic} transactionId='txn_id' />);

    fireEvent.click(screen.getByTestId('context-menu-trigger'));

    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));

    expect(copyToClipboardMock).toBeCalledWith(
      `Code: DIAGNOSTIC_CODE_FOO_BAR\n` +
        `Message: diagnostic_message\n` +
        `Model: diagnostic_model\n` +
        `Transaction-id: txn_id\n` +
        `Report:\n` +
        `diagnostic_report`,
    );
  });

  it('should have details button', () => {
    const mockDiagnostic: Diagnostic = {
      code: 'DIAGNOSTIC_CODE',
      severity: 'error',
      message: 'diagnostic_message',
      model: 'diagnostic_model',
      report: 'diagnostic_report',
    };

    render(
      <DiagnosticError diagnostic={mockDiagnostic} transactionId='txn_id' />,
    );

    expect(
      screen.getByRole('button', { name: 'Show details' }),
    ).toBeInTheDocument();
  });

  it('should not have details button if diagnostic has range', () => {
    render(<DiagnosticError diagnostic={diagnostic} transactionId='txn_id' />);

    expect(
      screen.queryByRole('button', { name: 'Show details' }),
    ).not.toBeInTheDocument();
  });

  it('should toggle details when pressing Details button', async () => {
    const user = userEvent.setup();
    const mockDiagnostic: Diagnostic = {
      code: 'DIAGNOSTIC_CODE',
      severity: 'error',
      message: 'diagnostic_message',
      model: 'diagnostic_model',
      report: 'diagnostic_report',
    };

    render(
      <DiagnosticError diagnostic={mockDiagnostic} transactionId='txn_id' />,
    );

    expect(
      screen.getByRole('button', { name: 'Show details' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('diagnostic_report')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Transaction id: txn_id'),
    ).not.toBeInTheDocument();

    await act(
      async () =>
        await user.click(screen.getByRole('button', { name: 'Show details' })),
    );
    expect(screen.getByText('diagnostic_report')).toBeInTheDocument();
    expect(screen.getByText('Transaction id: txn_id')).toBeInTheDocument();

    await act(
      async () =>
        await user.click(screen.getByRole('button', { name: 'Hide details' })),
    );
    expect(screen.queryByText('diagnostic_report')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Transaction id: txn_id'),
    ).not.toBeInTheDocument();
  });
});
