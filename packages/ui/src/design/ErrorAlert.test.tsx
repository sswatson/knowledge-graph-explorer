import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  MaxRelationSizeError,
  Problem,
} from '@relationalai/rai-sdk-javascript/web';

import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert', () => {
  const error = {
    status: 'Bad Request',
    message: 'Mock Error',
    details: 'Error details',
  };
  const problems: Problem[] = [
    {
      type: 'ClientProblem',
      is_exception: false,
      is_error: true,
      error_code: 'UNDEFINED',
      path: 'path 1',
      report: 'report 1',
      message: 'message 1',
    },
    {
      type: 'ClientProblem',
      is_exception: false,
      is_error: true,
      error_code: 'UNDEFINED',
      path: 'path 2',
      report: 'report 2',
      message: 'message 2',
    },
  ];

  it('should display simple string error', () => {
    render(<ErrorAlert error='String Error' />);

    expect(
      screen.getByText('String Error', { exact: true }),
    ).toBeInTheDocument();
  });

  it('should display error object', () => {
    render(<ErrorAlert error={error} />);

    expect(
      screen.getByText('Bad Request', { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mock Error', { exact: true })).toBeInTheDocument();
    expect(
      screen.getByText('Error details', { exact: true }),
    ).toBeInTheDocument();
  });

  it('should display problems', () => {
    render(<ErrorAlert error={{ problems }} />);

    expect(screen.getByText('path 1', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('path 2', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('report 1', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('report 2', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('message 1', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('message 2', { exact: true })).toBeInTheDocument();
  });

  it('should render copy button for simple string', async () => {
    const user = userEvent.setup();

    render(<ErrorAlert error='String Error' />);

    expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();

    await act(async () => {
      await user.hover(screen.getByRole('alert').children[0]);
    });

    expect(screen.queryByTestId('copy-button')).toBeInTheDocument();
  });

  it('should render copy button for error object', async () => {
    const user = userEvent.setup();

    render(<ErrorAlert error={error} />);

    expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();

    await act(async () => {
      await user.hover(screen.getByRole('alert').children[0]);
    });

    expect(screen.queryByTestId('copy-button')).toBeInTheDocument();
  });

  it('should render copy button for problems', () => {
    render(<ErrorAlert error={{ problems: [problems[0]] }} />);

    expect(screen.queryByTestId('copy-button')).toBeInTheDocument();
  });

  it('should display max relation size erroor', () => {
    const error = new MaxRelationSizeError('relId', 200, 123);

    render(<ErrorAlert error={error} />);

    expect(
      screen.getByText(
        'Cannot display a relation greater than 123 bytes. Relation: relId',
      ),
    ).toBeInTheDocument();
  });
});
