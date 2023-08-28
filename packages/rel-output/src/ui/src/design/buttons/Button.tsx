import classNames from 'classnames';
import { forwardRef, ReactNode } from 'react';

import { Spinner } from '../Spinner';

export const buttonSharedClasses = {
  button:
    'relative inline-flex items-center border font-medium rounded shadow-sm focus:outline-none group-disabled:opacity-70 group-disabled:cursor-not-allowed disabled:opacity-70 disabled:cursor-not-allowed',
  spinner: 'absolute inset-0 m-auto',
};

export const buttonTypeClasses = {
  danger: {
    button: 'text-white bg-red-500 hover:bg-red-600 focus:ring-0',
    spinner: 'text-white',
  },
  primary: {
    button: 'text-white bg-red-orange-900 hover:bg-red-orange-700 focus:ring-0',
    spinner: 'text-white',
  },
  secondary: {
    button:
      'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-0',
    spinner: 'text-gray-700',
  },
  gray: {
    button: 'text-gray-700 bg-gray-100 hover:bg-white focus:ring-gray-500',
    spinner: 'ext-gray-700',
  },
  off: {
    button: 'text-gray-800 font-bold bg-white hover:bg-gray-50 focus:ring-0',
    spinner: 'text-gray-700',
  },
  on: {
    button: 'text-gray-800 font-bold bg-gray-300 focus:ring-0',
    spinner: 'text-gray-800',
  },
};

export const sizeClasses = {
  xs: {
    button: 'px-2.5 py-1.5 text-xs',
    spinner: 'w-4',
  },
  sm: {
    button: 'px-3 py-2 text-sm',
    spinner: 'w-4',
  },
  default: {
    button: 'px-4 py-2 text-sm',
    spinner: 'w-4',
  },
  lg: {
    button: 'px-4 py-2 text-base',
    spinner: 'w-4',
  },
  xl: {
    button: 'px-6 py-3 text-base',
    spinner: 'w-5',
  },
};

type BaseButtonProps = {
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  type?: 'danger' | 'primary' | 'secondary' | 'gray' | 'off' | 'on';
  className?: string;
  children: ReactNode;
  [s: string]: any;
};

export type ButtonProps = BaseButtonProps & {
  htmlType?: 'button' | 'submit' | 'reset';
  loading?: boolean;
};

type LinkButtonProps = BaseButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      size = 'default',
      type = 'primary',
      className,
      children,
      htmlType = 'button',
      loading,
      ...props
    }: ButtonProps,
    reference,
  ) {
    return (
      <button
        type={htmlType}
        disabled={loading}
        className={classNames(
          buttonSharedClasses.button,
          sizeClasses[size].button,
          buttonTypeClasses[type].button,
          className,
        )}
        {...props}
        ref={reference}
      >
        {loading && (
          <Spinner
            className={classNames(
              buttonSharedClasses.spinner,
              sizeClasses[size].spinner,
              buttonTypeClasses[type].spinner,
            )}
          />
        )}
        <span className={classNames('contents', { invisible: loading })}>
          {children}
        </span>
      </button>
    );
  },
);

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function Button(
    {
      size = 'default',
      type = 'primary',
      className,
      children,
      ...props
    }: ButtonProps,
    reference,
  ) {
    return (
      <a
        className={classNames(
          buttonSharedClasses.button,
          sizeClasses[size].button,
          buttonTypeClasses[type].button,
          className,
        )}
        {...props}
        ref={reference}
      >
        <span className={classNames('contents')}>{children}</span>
      </a>
    );
  },
);
