import { useRef } from 'react';

import {
  ClientProblem,
  Problem as DbProblem,
} from '@relationalai/rai-sdk-javascript/web';

import { CopyButton } from './buttons/CopyButton';
import { ErrorFeedback } from './ErrorFeedback';
import { HoverMenu } from './HoverMenu';

type ProblemProps = {
  problem: DbProblem;
  requestId?: string;
  allowCopy?: boolean;
  onFeedback?: (message: string) => void;
  transactionId?: string;
};

export const stringifyProblem = (
  problem: ClientProblem,
  requestId?: string,
  transactionId?: string,
): string => {
  const copyText = [
    `Code: ${problem.error_code}`,
    `Message: ${problem.message}`,
    problem.path ? `Model: ${problem.path}` : '',
    requestId ? `Request-id: ${requestId}` : '',
    transactionId ? `Transaction-id: ${transactionId}` : '',
    ...((problem.report && `Report: ${problem.report}`) || '').split('\n'),
  ];

  return copyText.filter(line => line?.toString().trim()).join('\n');
};

export function Problem({
  problem,
  requestId,
  allowCopy = true,
  onFeedback,
  transactionId,
}: ProblemProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  if (problem.type === 'IntegrityConstraintViolation') {
    const handleCopy = () => {
      const copyText = ['INTEGRITY_CONSTRAINT_VIOLATION'];

      problem.sources.forEach(s =>
        s.source.split('\n').forEach(line => copyText.push(line)),
      );

      copyText.push(`transactionId: ${transactionId}`);

      return copyText.filter(line => line.trim()).join('\n');
    };

    return (
      <div ref={triggerRef} className='m-auto'>
        <div className='font-bold'>INTEGRITY_CONSTRAINT_VIOLATION</div>
        <div className='report'>
          {problem.sources.map(icSource => {
            return (icSource.source || '').split('\n').map((line, index) => {
              return <pre key={index}>{line}</pre>;
            });
          })}
          <div className='message'>{'ICs violated'}</div>
          {transactionId && (
            <div className='py-1'>
              <span>Transaction-id: </span>
              <span className='italic'>{transactionId}</span>
            </div>
          )}
        </div>
        <HoverMenu triggerRef={triggerRef}>
          <CopyButton onCopy={handleCopy} />
        </HoverMenu>
      </div>
    );
  }

  if (problem.type === 'ClientProblem') {
    const problemString = stringifyProblem(problem, requestId, transactionId);

    return (
      <div ref={triggerRef} className='m-auto relative'>
        <div className='flex flex-col overflow-x-auto'>
          <div className='flex items-center space-x-2'>
            <span>Code: </span>
            <span>{problem.error_code}</span>
            <div className='grow flex gap-6 justify-end'>
              {onFeedback && (
                <ErrorFeedback
                  problem={problem}
                  requestId={requestId}
                  transactionId={transactionId}
                  onFeedback={onFeedback}
                />
              )}
              {allowCopy && (
                <div className='self-start p-2 bg-white rounded-md shadow-sm border border-indigo-100 text-indigo-500'>
                  <CopyButton
                    tooltipText='Copy Details'
                    onCopy={() => problemString}
                  />
                </div>
              )}
            </div>
          </div>
          <div className='mb-2'>
            <span>Message: </span>
            <span>{problem.message}</span>
          </div>
          {requestId && (
            <div className='mb-2'>
              <span>Request-id: </span>
              <span className='italic'>{requestId}</span>
            </div>
          )}
          {transactionId && (
            <div className='mb-2'>
              <span>Transaction-id: </span>
              <span className='italic'>{transactionId}</span>
            </div>
          )}
          {problem.path && (
            <div className='mb-2'>
              <span>Model: </span>
              <span>{problem.path}</span>
            </div>
          )}
          {problem.report && (
            <div className='mb-2'>
              <span>Report: </span>
              <pre className='whitespace-pre-wrap'>{problem.report}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
