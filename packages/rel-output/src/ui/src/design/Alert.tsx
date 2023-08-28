import classNames from 'classnames';
import { ReactNode } from 'react';

const ALERT_TYPES = {
  message: 'text-gray-500 bg-gray-50 border-gray-400',
  info: 'text-blue-400 bg-blue-50 border-blue-400',
  error: 'text-red-400 bg-red-50 border-red-400',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-400',
};

export type AlertProps = {
  type: keyof typeof ALERT_TYPES;
  children: ReactNode;
  className?: string;
};

export function Alert({ type = 'message', className, children }: AlertProps) {
  return (
    <div
      className={classNames(
        `px-4 py-3 shadow-md leading-normal border-l-4 overflow-x-auto ${ALERT_TYPES[type]}`,
        className,
      )}
      role='alert'
    >
      {children}
    </div>
  );
}
