import { compact } from 'lodash-es';

import { Problem } from '@relationalai/rai-sdk-javascript/web';

export type ErrorObject = {
  message?: string;
  status?: string;
  details?: string;
  requestId?: string;
  problems?: Problem[];
};

export const stringifyError = (
  error: ErrorObject,
  requestId?: string,
  transactionId?: string,
): string =>
  compact([
    error.status,
    requestId,
    transactionId,
    error.message,
    error.details,
  ]).join('\n');
