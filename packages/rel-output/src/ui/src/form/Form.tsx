import { ReactNode } from 'react';
import {
  FieldValues,
  FormProvider,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';

type FormProps<T extends FieldValues> = {
  hookMethods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
};

export default function Form<T extends FieldValues>({
  hookMethods,
  onSubmit,
  children,
}: FormProps<T>) {
  return (
    <FormProvider {...hookMethods}>
      <form onSubmit={hookMethods.handleSubmit(onSubmit)}>
        {children}
        {/* it is necesseary to have a hidden button to submit the form via enter key */}
        <button type='submit' className='hidden' />
      </form>
    </FormProvider>
  );
}
