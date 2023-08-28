import { ComponentType, forwardRef } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

import { Alert } from './Alert';
import { Button } from './buttons/Button';

export type ErrorFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

function ErrorFallback({ resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className='flex flex-row overflow-y-auto gap-4 p-4'>
      <div className='flex-1'>
        <Alert type='error'>
          <div>Internal exception occurred while rendering.</div>
        </Alert>
      </div>
      <Button onClick={resetErrorBoundary} size='sm'>
        Try again
      </Button>
    </div>
  );
}

// We wrap the component in a `forwardRef` as some components need to pass the
// reference through.
export function withErrorBoundary<T extends object>(
  Component: ComponentType<T>,
  FallbackComponent?: ComponentType<ErrorFallbackProps>,
) {
  return forwardRef((props: T, reference) => (
    <ReactErrorBoundary FallbackComponent={FallbackComponent || ErrorFallback}>
      <Component {...props} ref={reference} />
    </ReactErrorBoundary>
  ));
}
