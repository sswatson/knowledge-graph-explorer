import { fireEvent, render, screen } from '@testing-library/react';

import { ErrorFeedback } from './ErrorFeedback';

describe('Feedback Error', () => {
  it('should display thanks message when answer is chosen', () => {
    const onFeedbackMock = jest.fn();
    const problem = {
      message: 'some message',
      error_code: 'UNDEFINED',
      report: 'some report',
      type: 'ClientProblem' as const,
      is_error: true,
      is_exception: false,
      path: '',
    };

    render(
      <ErrorFeedback
        problem={problem}
        transactionId='some-txn-id'
        onFeedback={onFeedbackMock}
      />,
    );

    expect(onFeedbackMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('yes-button')).toBeInTheDocument;
    expect(screen.queryByTestId('no-button')).toBeInTheDocument;

    fireEvent.click(screen.getByTestId('yes-button'));

    expect(onFeedbackMock).toHaveBeenCalledWith(
      JSON.stringify({
        rai: {
          transaction_id: 'some-txn-id',
        },
        errorFeedback: {
          helpful: true,
          problem,
        },
      }),
    );
    expect(screen.queryByTestId('yes-button')).not.toBeInTheDocument;
    expect(screen.queryByTestId('no-button')).not.toBeInTheDocument;
    expect(screen.queryByText('Thanks')).toBeInTheDocument;
  });
});
