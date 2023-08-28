import classNames from 'classnames';
import { get } from 'lodash-es';
import {
  FieldErrors,
  RegisterOptions,
  useFormContext,
  UseFormRegisterReturn,
} from 'react-hook-form';

const errorClasses = 'focus:ring-red-500 text-red-600 border-red-300';
const defaultClasses = 'focus:ring-gray-500 text-gray-600 border-gray-300';

type ConnectedCheckboxProps = {
  name: string;
  label: string;
  regOptions?: RegisterOptions;
};

export function ConnectedCheckbox({
  name,
  label,
  regOptions,
}: ConnectedCheckboxProps) {
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
    <PureCheckbox
      name={name}
      label={label}
      errors={errors}
      register={register}
      regOptions={regOptions}
    />
  );
}

type PureCheckboxProps = {
  name: string;
  label: string;
  errors?: FieldErrors;
  register: (
    name: string,
    options?: RegisterOptions,
  ) => Partial<UseFormRegisterReturn>;
  regOptions?: RegisterOptions;
  defaultValue?: boolean;
  value?: boolean;
  disabled?: boolean;
};

export function PureCheckbox({
  name,
  label,
  errors,
  register,
  regOptions,
  defaultValue,
  value,
  disabled,
}: PureCheckboxProps) {
  const error = get(errors, name);

  return (
    <div className='relative flex items-start'>
      <div className='flex items-center h-5'>
        <input
          id={name}
          name={name}
          type='checkbox'
          className={classNames(
            'h-4 w-4 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
            error ? errorClasses : defaultClasses,
          )}
          defaultChecked={defaultValue}
          checked={value}
          disabled={disabled}
          {...register(name, regOptions)}
        />
      </div>
      <div className='ml-3 text-sm'>
        <label
          htmlFor={name}
          className={classNames(
            'cursor-pointer',
            error ? 'text-red-500' : 'text-gray-700',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {label}
        </label>
      </div>
    </div>
  );
}

export default ConnectedCheckbox;
