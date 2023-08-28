import classNames from 'classnames';
import { get } from 'lodash-es';
import { AriaAttributes, FocusEvent, useEffect, useRef, useState } from 'react';
import {
  FieldErrors,
  RegisterOptions,
  useFormContext,
  UseFormRegisterReturn,
} from 'react-hook-form';
import { RiErrorWarningLine } from 'react-icons/ri';

import { CopyButton } from '../design/buttons/CopyButton';

const errorClasses =
  'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500';
const defaultClasses =
  'focus:ring-red-orange-500 focus:border-red-orange-500 border-gray-300';

type HTMLInputType =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week';

type ConnectedInputProps = {
  name: string;
  type?: HTMLInputType;
  placeholder?: string;
  readOnly?: boolean;
  regOptions?: RegisterOptions;
  canCopy?: boolean;
  preSelectAll?: boolean;
  preSelectText?: string;
};

export function ConnectedInput({
  name,
  regOptions,
  placeholder,
  readOnly,
  type = 'text',
  canCopy = false,
  preSelectText,
  preSelectAll,
}: ConnectedInputProps) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  const {
    register,
    formState: { errors },
  } = formContext;

  return (
    <PureInput
      name={name}
      type={type}
      errors={errors}
      register={register}
      regOptions={regOptions}
      placeholder={placeholder}
      readOnly={readOnly}
      canCopy={canCopy}
      preSelectAll={preSelectAll}
      preSelectText={preSelectText}
    />
  );
}

type PureInputProps = {
  name: string;
  type?: HTMLInputType;
  register: (
    name: string,
    options?: RegisterOptions,
  ) => Partial<UseFormRegisterReturn>;
  errors?: FieldErrors;
  regOptions?: RegisterOptions;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  canCopy?: boolean;
  preSelectAll?: boolean;
  preSelectText?: string;
  'data-testid'?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
} & AriaAttributes;

const iconIndexMap: { [key: number]: string } = {
  1: 'pr-8',
  2: 'pr-14',
  3: 'pr-20',
};

export function PureInput({
  name,
  type = 'text',
  errors,
  register,
  regOptions,
  defaultValue,
  preSelectText,
  preSelectAll,
  placeholder,
  readOnly,
  canCopy = false,
  ...props
}: PureInputProps) {
  const wrapperReference = useRef<HTMLDivElement>(null);
  const error = get(errors, name);
  const [copyValue, setCopyValue] = useState(regOptions?.value || defaultValue);

  useEffect(() => {
    if (preSelectAll || preSelectText) {
      const input = wrapperReference.current?.querySelector('input');

      if (input && type === 'text') {
        if (preSelectAll) {
          input.select();
        } else if (preSelectText && input.value) {
          const index = input.value.indexOf(preSelectText);

          input.setSelectionRange(index, index + (input.value.length - index));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectAll, preSelectText]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (canCopy) {
      // using wrapper ref so that we don't have to mess with register's ref
      const inputValue = wrapperReference.current?.querySelector('input')
        ?.value;

      if (inputValue !== copyValue) {
        setCopyValue(inputValue);
      }
    }
  });

  const icons: JSX.Element[] = [];

  if (canCopy && copyValue) {
    icons.push(
      <CopyButton key='copy' placement='top' onCopy={() => copyValue} />,
    );
  }

  if (error) {
    icons.push(
      <RiErrorWarningLine
        key='error'
        data-testid={`input-error-icon-${name}`}
        className='h-5 w-5 text-red-500 pointer-events-none placeholder-gray-400'
        aria-hidden='true'
      />,
    );
  }

  return (
    <div className='flex rounded-md shadow-sm relative' ref={wrapperReference}>
      <input
        id={name}
        type={type}
        className={classNames(
          'flex-grow focus:outline-none sm:text-sm rounded-md',
          'read-only:opacity-50 placeholder-gray-400 w-full',
          error ? errorClasses : defaultClasses,
          icons.length > 0 && iconIndexMap[icons.length],
        )}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        {...register(name, regOptions)}
        {...props}
      />
      {icons.length > 0 && (
        <div
          className={classNames(
            'absolute top-0 right-0 flex px-3 py-2 items-center rounded-r-md',
            error
              ? 'border-red-300'
              : readOnly
              ? 'border-gray-200'
              : 'border-gray-300',
          )}
        >
          {icons}
        </div>
      )}
    </div>
  );
}

export default ConnectedInput;
