import { Placement } from '@floating-ui/react';
import classNames from 'classnames';
import { Fragment, LegacyRef, MouseEvent } from 'react';
import {
  Controller,
  UseControllerProps,
  useFormContext,
} from 'react-hook-form';
import { HiSelector } from 'react-icons/hi';
import { RiCloseLine } from 'react-icons/ri';

import { DropdownInput } from '../design';
import {
  Dropdown,
  DropdownOptionProps,
  DropdownProps,
} from '../design/Dropdown';
import { Tooltip } from '../design/Tooltip';

type ConnectedSelectProps<T extends DropdownOptionProps> = Omit<
  PureSelectProps<T>,
  'inputRef' | 'onSelect' | 'error'
> &
  Pick<UseControllerProps, 'rules'>;

export function ConnectedSelect<T extends DropdownOptionProps>({
  name,
  rules = {},
  ...props
}: ConnectedSelectProps<T>) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  const { control } = formContext;
  const isClearable = !rules.required;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, ref, value } }) => (
        <PureSelect
          name={name}
          value={value}
          onSelect={value => onChange(value)}
          inputRef={ref}
          isClearable={isClearable}
          {...props}
        />
      )}
    />
  );
}

export default ConnectedSelect;

export type OptionValue = number | string | boolean;

type PureSelectProps<T extends DropdownOptionProps> = Omit<
  DropdownProps<T>,
  'triggerElement' | 'onSelect' | 'disabled' | 'testIdPrefix' | 'selected'
> & {
  name: string;
  value?: OptionValue;
  placeholderText?: string;
  onSelect: (value?: OptionValue) => void;
  error?: Error;
  inputRef?: LegacyRef<HTMLDivElement>;
  isClearable?: boolean;
  readOnly?: boolean;
  tooltipPlacement?: Placement;
};

export function PureSelect<T extends DropdownOptionProps>({
  name,
  options,
  value,
  placeholderText,
  onSelect,
  error,
  inputRef,
  isClearable,
  readOnly = false,
  tooltipPlacement = 'top',
  search,
  ...props
}: PureSelectProps<T>) {
  const selectedOption = options.find(o => o.value === value);

  const clear = (event: MouseEvent) => {
    event.stopPropagation();
    onSelect(undefined);
  };

  const isEmpty = !selectedOption && !placeholderText;

  const selectedOptionElement = search ? (
    <DropdownInput
      className={classNames(
        'p-0 border-none w-full focus:outline-none focus:ring-0 rounded-md bg-transparent flex-1 truncate text-black text-sm',
        'placeholder:text-sm placeholder-gray-400',
        isClearable && 'pr-4',
      )}
    />
  ) : selectedOption ? (
    <Tooltip text={selectedOption?.label} placement={tooltipPlacement}>
      <div className='relative'>
        <span
          className='block truncate text-sm'
          data-testid='select-trigger-label'
        >
          {selectedOption.label}
        </span>
      </div>
    </Tooltip>
  ) : (
    <div className='relative'>
      <span
        className='block truncate text-sm'
        data-testid='select-trigger-label'
      >
        {placeholderText}
      </span>
    </div>
  );

  const triggerElement = (
    <div
      data-testid={`${name}-trigger`}
      ref={inputRef}
      className={classNames(
        'bg-white relative w-full border rounded-md shadow-sm pl-3 pr-10 py-2 sm:text-sm text-left',
        'group-focus:ring-1 group-focus:ring-red-orange-500 group-focus:border-red-orange-500',
        !selectedOption && 'text-gray-400',
        // gives proper height to empty dropdowns
        isEmpty && "before:content-['.'] before:invisible",
        error &&
          'ring-1 text-red-900 placeholder-red-300 ring-red-500 border-red-500',
        !error && 'border-gray-300',
        readOnly && 'opacity-50 cursor-not-allowed',
      )}
    >
      {selectedOptionElement}

      {isClearable && selectedOption && (
        <span className='absolute inset-y-0 right-6 flex items-center pr-1'>
          {/*eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <div
            role='button'
            className={classNames(
              'pr-1 border-r',
              error && 'border-red-900',
              !error && 'border-gray-400',
            )}
            data-testid={`clear-${name}`}
            onClick={clear}
            tabIndex={0}
          >
            <RiCloseLine
              className={classNames(
                'h-4 w-4',
                error && 'text-red-900',
                !error && 'text-gray-400',
              )}
              aria-hidden='true'
            />
          </div>
        </span>
      )}

      <span className='absolute inset-y-0 right-0 flex items-center pr-2'>
        <HiSelector
          className={classNames(
            'h-5 w-5',
            error && 'text-red-900',
            !error && 'text-gray-400',
          )}
          aria-hidden='true'
        />
      </span>
    </div>
  );

  return (
    <Fragment>
      <Dropdown
        triggerElement={triggerElement}
        options={options}
        onSelect={value => onSelect(value)}
        disabled={readOnly}
        testIdPrefix={name}
        selected={value}
        name={name}
        placeholderText={placeholderText}
        displayValue={selectedOption?.label}
        search={search}
        {...props}
      />

      {error && (
        <p className='mt-2 text-sm text-red-600' id={`${name}-error`}>
          {error && error.message}
        </p>
      )}
    </Fragment>
  );
}
