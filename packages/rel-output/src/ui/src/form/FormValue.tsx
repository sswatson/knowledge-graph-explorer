import { useFormContext, useWatch } from 'react-hook-form';

type ConnectedFormValueProps = {
  name: string;
  children?: (value: any) => JSX.Element;
};

export function ConnectedFormValue({
  name,
  children,
}: ConnectedFormValueProps) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  const value = useWatch({ name, control: formContext.control });

  if (children) {
    return children(value);
  }

  return <div id={name}>{value}</div>;
}

export default ConnectedFormValue;
