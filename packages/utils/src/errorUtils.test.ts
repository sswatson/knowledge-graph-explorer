import { stringifyError } from './errorUtils';

describe('errorUtils', () => {
  it('stringifyError', () => {
    const reqId = 'rId1';
    const txnId = 'txnId1';
    const errorDetails = {
      reqId,
      status: 'Bad Request',
      message: 'engine not found',
      details: 'foo bar',
    };
    const errorText = stringifyError(errorDetails, reqId, txnId);

    expect(errorText).toEqual(
      `Bad Request\n${reqId}\n${txnId}\nengine not found\nfoo bar`,
    );
  });
});
