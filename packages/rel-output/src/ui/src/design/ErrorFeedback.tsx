import { MouseEvent, useState } from 'react';
import { TiThumbsDown, TiThumbsUp } from 'react-icons/ti';

import { ClientProblem } from '@relationalai/rai-sdk-javascript/web';
import { Diagnostic } from '@relationalai/utils';

type ErrorFeedbackProps = {
  problem?: ClientProblem;
  diagnostic?: Diagnostic;
  requestId?: string;
  transactionId?: string;
  onFeedback?: (message: string) => void;
};

export function ErrorFeedback({
  problem,
  diagnostic,
  requestId,
  transactionId,
  onFeedback,
}: ErrorFeedbackProps) {
  const [hasAnswered, setAnswered] = useState(false);

  const onClick = (event: MouseEvent, helpful: boolean) => {
    event.stopPropagation();
    setAnswered(true);
    onFeedback?.(
      JSON.stringify({
        request_id: requestId,
        rai: {
          transaction_id: transactionId,
        },
        errorFeedback: {
          helpful,
          problem,
          diagnostic,
        },
      }),
    );
  };

  return (
    <div
      data-testid='error-feedback'
      className='flex items-center text-gray-400 whitespace-nowrap'
    >
      {!hasAnswered ? (
        <>
          <button
            className='hover:text-gray-500 px-[0.5]'
            data-testid='yes-button'
            onClick={event => onClick(event, true)}
          >
            <TiThumbsUp className='w-5 h-5' />
          </button>
          <button
            className='hover:text-gray-500 px-[0.5]'
            data-testid='no-button'
            onClick={event => onClick(event, false)}
          >
            <TiThumbsDown className='w-5 h-5' />
          </button>
        </>
      ) : (
        <div>Thanks!</div>
      )}
    </div>
  );
}
