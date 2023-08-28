import { isString, orderBy } from 'lodash-es';

import {
  MaxRelationSizeError,
  SdkError,
} from '@relationalai/rai-sdk-javascript/web';
import { ErrorObject } from '@relationalai/utils';

import { Alert } from './Alert';
import { Error } from './Error';
import { Problem } from './Problem';

type ErrorAlertProps = {
  error: string | ErrorObject | SdkError;
  requestId?: string;
  transactionId?: string;
  onFeedback?: (message: string) => void;
};

export function ErrorAlert({
  error,
  requestId,
  transactionId,
  onFeedback,
}: ErrorAlertProps) {
  let errorObject: ErrorObject = isString(error)
    ? { message: error, problems: [] }
    : error;

  if (error instanceof MaxRelationSizeError) {
    errorObject = {
      message: `Cannot display a relation greater than ${error.maxSize} bytes. Relation: ${error.relationId}`,
    };
  }

  if (errorObject.problems?.length) {
    return (
      <div className='space-y-2'>
        {orderBy(errorObject.problems, ['is_error']).map((p, i) => (
          <Alert key={i} type='error'>
            <Problem
              problem={p}
              requestId={requestId}
              transactionId={transactionId}
              onFeedback={onFeedback}
            />
          </Alert>
        ))}
      </div>
    );
  }

  if (errorObject.message) {
    return (
      <Alert type='error'>
        <Error
          error={errorObject}
          requestId={requestId}
          transactionId={transactionId}
        />
      </Alert>
    );
  }

  return null;
}
