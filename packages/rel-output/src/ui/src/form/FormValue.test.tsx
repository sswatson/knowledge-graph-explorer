import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import FormValue from './FormValue';

describe('FormValue', () => {
  it('should throw an error if no form context found', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<FormValue name='foo' />);
    }).toThrow();
    error.mockReset();
  });

  it('should display form value', async () => {
    const name = 'foo';

    function TestComponent() {
      const methods = useForm({
        defaultValues: {
          foo: 'test value',
        },
      });

      return (
        <FormProvider {...methods}>
          <FormValue name={name} />
        </FormProvider>
      );
    }

    render(<TestComponent />);

    expect(screen.getByText('test value')).toBeInTheDocument();
  });

  it('should display form value with custom renderer', async () => {
    const name = 'foo';

    function TestComponent() {
      const methods = useForm({
        defaultValues: {
          foo: 'test value',
        },
      });

      return (
        <FormProvider {...methods}>
          <FormValue name={name}>
            {value => <div data-testid='inner-div'>{value}</div>}
          </FormValue>
        </FormProvider>
      );
    }

    render(<TestComponent />);

    const element = screen.getByTestId('inner-div');

    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('test value');
  });
});
