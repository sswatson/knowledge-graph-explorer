import '../../styles/date-time-picker.css';

import { autoPlacement, autoUpdate, useFloating } from '@floating-ui/react';
import { Popover, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { get, isArray } from 'lodash-es';
import { KeyboardEvent, MouseEvent, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Controller, FieldErrors, useFormContext } from 'react-hook-form';
import { MdOutlineCalendarMonth } from 'react-icons/md';
import { RiCloseLine } from 'react-icons/ri';
import {
  Calendar,
  CalendarProps,
  DateObject,
  Value,
} from 'react-multi-date-picker';
import TimePicker, {
  TimePickerProps,
} from 'react-multi-date-picker/plugins/time_picker';

import { Button, Tooltip } from '../design';

type ValueOnChangeProps =
  | {
      range: true;
      onChange?: (value?: Date[]) => void;
      value?: Date[];
    }
  | {
      range?: false;
      onChange?: (value?: Date) => void;
      value?: Date;
    };

type ConnectedDateTimePickerProps = Omit<DateTimePickerProps, 'errors'>;

type DateTimePickerProps = {
  name: string;
  defaultValue?: Date;
  readOnly?: boolean;
  errors?: FieldErrors;
  placeholder?: string;
  isClearable?: boolean;
  disabled?: boolean;
  testIdPrefix?: string;
  enableTimePicker?: boolean;
  timePickerProps?: TimePickerProps;
} & Omit<
  CalendarProps,
  'onChange' | 'className' | 'plugins' | 'multiple' | 'range' | 'value'
> &
  ValueOnChangeProps;

export function ConnectedDateTimePicker({
  name,
  ...props
}: ConnectedDateTimePickerProps) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  const {
    control,
    formState: { errors },
  } = formContext;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <DateTimePicker
          name={name}
          value={value as any}
          onChange={onChange as any}
          errors={errors}
          {...props}
        />
      )}
    />
  );
}

export function DateTimePicker({
  name,
  readOnly,
  errors,
  isClearable = true,
  onChange,
  disabled,
  placeholder,
  value,
  format = 'YYYY-M-D h:mm A',
  showOtherDays = true,
  testIdPrefix = 'date-time-picker',
  enableTimePicker = false,
  timePickerProps,
  range,
  ...props
}: DateTimePickerProps) {
  const error = get(errors, name);
  const [lastValue, setLastValue] = useState(value);

  const getValueString = (value: Value) => {
    if (!value) {
      return '';
    }

    return isArray(value)
      ? value
          .map(date =>
            date instanceof DateObject
              ? date.format(format)
              : new DateObject(date).format(format),
          )
          .join(' - ')
      : new DateObject(value).format(format);
  };

  const handleChange = useCallback(
    (value: Value) => {
      if (isArray(value) && range) {
        onChange?.(value.map(date => new DateObject(date).toDate()));
      } else if (value && !isArray(value) && !range) {
        onChange?.(new DateObject(value).toDate());
      } else {
        onChange?.(undefined);
      }
    },
    [onChange, range],
  );

  const valueString = getValueString(value ?? null);

  const clear = (
    event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
    onChange?.(undefined);
  };

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [autoPlacement()],
  });

  const triggerElement = (
    <Popover.Button
      data-testid={`${name}-trigger`}
      ref={refs.setReference}
      className={classNames(
        'bg-white relative w-full border rounded-md shadow-sm pl-3 pr-12 py-2 sm:text-sm text-left',
        'focus:ring-1 focus:ring-red-orange-500 focus:border-red-orange-500 focus:outline-none',
        error &&
          'ring-1 text-red-900 placeholder-red-300 ring-red-500 border-red-500',
        !error && 'border-gray-300',
        readOnly && 'opacity-50 cursor-not-allowed',
      )}
      disabled={disabled}
      onClick={() => {
        setLastValue(value);
      }}
    >
      {valueString ? (
        <Tooltip text={valueString ?? ''} placement='top'>
          <span className='block truncate' data-testid='select-trigger-label'>
            {valueString}
          </span>
        </Tooltip>
      ) : (
        <span
          className='block truncate text-gray-400'
          data-testid='select-trigger-label'
        >
          {placeholder ?? 'Select a date'}
        </span>
      )}

      {isClearable && value && (
        <div
          className={classNames(
            'absolute inset-y-0 m-auto h-fit right-8',
            error && 'border-red-900',
            !error && 'border-gray-400',
          )}
          data-testid={`clear-${name}`}
          role='button'
          onKeyDown={e => e.key === 'Enter' && clear(e)}
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
      )}

      <MdOutlineCalendarMonth
        className={classNames(
          'absolute inset-y-0 right-0 flex items-center p-2 h-full w-auto',
          error && 'text-red-900',
          !error && 'text-gray-400',
        )}
        aria-hidden='true'
      />
    </Popover.Button>
  );

  const calendarClassName = classNames(
    'rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden',
  );

  return (
    <Popover>
      {triggerElement}
      {createPortal(
        <Popover.Panel>
          {({ open, close }) => (
            <div ref={refs.setFloating} className='z-50' style={floatingStyles}>
              <Transition
                show={open}
                appear
                enter='transition ease-out duration-100'
                enterFrom='transform opacity-0 scale-95'
                enterTo='transform opacity-100 scale-100'
                leave='transition ease-in duration-75'
                leaveFrom='transform opacity-100 scale-100'
                leaveTo='transform opacity-0 scale-95'
              >
                <Calendar
                  data-testid={`${testIdPrefix}-calendar`}
                  className={calendarClassName}
                  value={value}
                  onChange={handleChange}
                  showOtherDays={showOtherDays}
                  format={format}
                  readOnly={readOnly}
                  multiple={false}
                  plugins={
                    enableTimePicker
                      ? [
                          <TimePicker
                            key='time-picker'
                            position='bottom'
                            hideSeconds
                            {...timePickerProps}
                          />,
                        ]
                      : []
                  }
                  range={range}
                  {...props}
                >
                  <div className='p-2 flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <Button
                        size='xs'
                        type='secondary'
                        onClick={() => {
                          handleChange?.(lastValue ?? null);
                          close();
                        }}
                      >
                        Cancel
                      </Button>
                      {isClearable && (
                        <Button size='xs' type='secondary' onClick={clear}>
                          Clear
                        </Button>
                      )}
                    </div>
                    <Button size='xs' type='primary' onClick={close}>
                      Done
                    </Button>
                  </div>
                </Calendar>
              </Transition>
            </div>
          )}
        </Popover.Panel>,
        document.body,
      )}
    </Popover>
  );
}
