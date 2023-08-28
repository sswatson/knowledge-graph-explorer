import classNames from 'classnames';
import { get } from 'lodash-es';
import { useRef } from 'react';

import { ErrorObject, stringifyError } from '@relationalai/utils';

import { CopyButton } from './buttons/CopyButton';
import { HoverMenu } from './HoverMenu';

type FieldProps = {
  label: string;
  value: string;
  isRed?: boolean;
  isMono?: boolean;
};

const Field = ({ label, value, isRed = false, isMono = false }: FieldProps) => {
  return (
    <div>
      <span className='text-gray-500'>{label}: </span>
      <span
        className={classNames(
          isRed ? 'text-red-600' : 'text-gray-900',
          isMono ? 'font-mono' : 'font-sans',
        )}
      >
        {value}
      </span>
    </div>
  );
};

export function Error({
  error,
  requestId,
  transactionId,
  allowCopy = true,
}: {
  error: ErrorObject;
  requestId?: string;
  transactionId?: string;
  allowCopy?: boolean;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const _requestId = get(error, 'requestId', requestId);

  return (
    <div ref={triggerRef} className='flex flex-row min-h-[1.7rem]'>
      <div className='flex flex-col justify-center gap-2'>
        {_requestId && <Field label='Request ID' value={_requestId} isMono />}
        {transactionId && (
          <Field label='Transaction ID' value={transactionId} isMono />
        )}
        {error.status && <Field label='Status' value={error.status} />}
        {error.message && <Field label='Message' value={error.message} isRed />}
        {error.details && <Field label='Details' value={error.details} />}
      </div>
      {allowCopy && (
        <HoverMenu triggerRef={triggerRef} position='-top-1 -right-2'>
          <CopyButton
            size='sm'
            placement='left'
            tooltipText='Copy Details'
            onCopy={() => stringifyError(error, _requestId, transactionId)}
          />
        </HoverMenu>
      )}
    </div>
  );
}
