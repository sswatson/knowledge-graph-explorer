import { get } from 'lodash-es';
import { FieldErrors, useFormContext } from 'react-hook-form';

type ConnectedErrorMessageProps = {
  name: string;
};

export function ConnectedErrorMessage({ name }: ConnectedErrorMessageProps) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  const {
    formState: { errors },
  } = formContext;

  return <PureErrorMessage name={name} errors={errors} />;
}

type PureErrorMessageProps = {
  name: string;
  errors: FieldErrors;
};

export function PureErrorMessage({ name, errors }: PureErrorMessageProps) {
  const error = get(errors, name);
  const errorMsg = error?.message as string | undefined;

  if (!errorMsg) {
    return null;
  }

  return (
    <p data-testid={`error-${name}`} className='mt-2 text-sm text-red-600'>
      {errorMsg}
    </p>
  );
}

export default ConnectedErrorMessage;
