import { RadioGroup as HeadlessuiRadioGroup } from '@headlessui/react';
import classNames from 'classnames';
import { Fragment, ReactNode, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export type RadioOption<T> = {
  label: string;
  value: T;
};

type RadioGroupProps<T> = {
  name: string;
  value?: RadioOption<T> | undefined;
  onChange?: (value?: RadioOption<T>) => void;
  options: RadioOption<T>[];
  children?: ReactNode;
};

export function ConnectedRadioGroup<T>({ name, ...props }: RadioGroupProps<T>) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  const { control } = formContext;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <RadioGroup name={name} value={value} onChange={onChange} {...props} />
      )}
    />
  );
}

export function RadioGroup<T>({
  value,
  onChange,
  options,
  children,
}: RadioGroupProps<T>) {
  const compare = useCallback(
    (a: RadioOption<T> | undefined, b: RadioOption<T> | undefined) =>
      a?.label === b?.label,
    [],
  );

  return (
    <HeadlessuiRadioGroup<typeof Fragment, RadioOption<T>>
      by={compare}
      value={value}
      onChange={onChange}
    >
      {options.map(option => (
        <HeadlessuiRadioGroup.Option
          key={option.label}
          value={option}
          className='focus-visible:outline-red-orange-500 p-2 group/radio-group cursor-pointer text-gray-800 text-sm'
        >
          {({ checked, active }) => (
            <div className='space-y-2'>
              <div className='flex items-center gap-4'>
                <span
                  className={classNames(
                    'w-3 h-3 rounded-full flex-shrink-0 outline outline-2 outline-offset-2 outline-red-orange-900',
                    'transition-colors duration-200 ease-in-out',
                    {
                      'bg-red-orange-700': checked,
                      'bg-transparent group-hover/radio-group:bg-red-orange-300': !checked,
                      'bg-red-orange-900': active && checked,
                    },
                  )}
                />
                {option.label}
              </div>
              {checked ? children : null}
            </div>
          )}
        </HeadlessuiRadioGroup.Option>
      ))}
    </HeadlessuiRadioGroup>
  );
}
