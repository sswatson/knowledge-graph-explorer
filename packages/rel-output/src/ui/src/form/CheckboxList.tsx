import classNames from 'classnames';
import { keyBy } from 'lodash-es';
import { Fragment } from 'react';
import {
  ChangeHandler,
  Controller,
  UseControllerProps,
  useFormContext,
} from 'react-hook-form';

import { PureCheckbox } from './Checkbox';

type ConnectedCheckboxListProps = {
  name: string;
  options: CheckboxOptionGroup[];
} & Pick<UseControllerProps, 'rules'>;

export function ConnectedCheckboxList({
  name,
  options,
  rules = {},
}: ConnectedCheckboxListProps) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  return (
    <Controller
      control={formContext.control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value } }) => (
        <PureCheckboxList options={options} value={value} onChange={onChange} />
      )}
    />
  );
}

export type CheckboxOptionGroup = {
  label: string;
  description: string;
  options: CheckboxOption[];
};

export type CheckboxOption = {
  value: string;
  label: string;
  description: string;
  disabled?: boolean;
};

type PureCheckboxListProps = {
  options: CheckboxOptionGroup[];
  value: string[];
  onChange: (value: string[]) => void;
};

const descClasses = 'text-sm text-gray-500';

type GroupLookup = {
  [g: string]: {
    checked: boolean;
    values: string[];
    disabled?: boolean;
  };
};

export function PureCheckboxList({
  options,
  value = [],
  onChange,
}: PureCheckboxListProps) {
  const optionLookup = keyBy(value);
  const groupLookup = options.reduce((memo, group) => {
    const availableOptions = group.options.filter(o => !o.disabled);

    const isChecked =
      availableOptions.length === 0
        ? group.options.every(o => optionLookup[o.value])
        : availableOptions.every(o => optionLookup[o.value]);

    memo[group.label] = {
      values: availableOptions.map(o => o.value),
      checked: isChecked,
      disabled: availableOptions.length === 0,
    };

    return memo;
  }, {} as GroupLookup);

  const register = (name: string) => {
    const changeHandler: ChangeHandler = event => {
      const checked = event.target.checked as boolean;
      const targetValues = groupLookup[name]?.values || [name];
      const newValues = { ...optionLookup };

      targetValues.forEach(val => {
        if (checked) {
          newValues[val] = val;
        } else {
          delete newValues[val];
        }
      });

      onChange(Object.keys(newValues));

      return Promise.resolve();
    };

    return {
      onChange: changeHandler,
    };
  };

  const renderGroup = (group: CheckboxOptionGroup) => {
    return (
      <Fragment key={group.label}>
        {group.label && (
          <tr className='border-b-8 border-transparent'>
            <td className='font-bold'>
              <PureCheckbox
                name={group.label}
                label={group.label}
                register={register}
                value={groupLookup[group.label].checked}
                disabled={groupLookup[group.label].disabled}
              />
            </td>
            <td className={descClasses}>{group.description}</td>
          </tr>
        )}

        {group.options.map(renderOption)}
      </Fragment>
    );
  };

  const renderOption = (option: CheckboxOption) => {
    return (
      <tr key={option.label} className='border-b-8 border-transparent'>
        <td className='pl-8 pr-2 align-top'>
          <PureCheckbox
            name={option.value}
            label={option.label}
            register={register}
            value={!!optionLookup[option.value]}
            disabled={option.disabled}
          />
        </td>
        <td
          className={classNames(
            descClasses,
            'align-top px-2',
            option.disabled && 'opacity-50',
          )}
        >
          {option.description}
        </td>
      </tr>
    );
  };

  return (
    <table className='w-full'>
      <tbody>{options.map(renderGroup)}</tbody>
    </table>
  );
}

export default ConnectedCheckboxList;
