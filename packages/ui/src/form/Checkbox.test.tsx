import { fireEvent, render, screen } from '@testing-library/react';
import { FieldErrors, FormProvider, useForm } from 'react-hook-form';

import { ConnectedCheckbox, PureCheckbox } from './Checkbox';

describe('Checkbox', () => {
  describe('ConnectedCheckbox', () => {
    it('should throw an error if no form context found', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ConnectedCheckbox name='foo' label='bar' />);
      }).toThrow();
      error.mockReset();
    });

    it('should connect pure checkbox to form', async () => {
      const name = 'foo';

      function TestComponent() {
        const methods = useForm({
          mode: 'onChange',
          defaultValues: {
            foo: false,
          },
        });

        const value = methods.watch(name);

        return (
          <FormProvider {...methods}>
            <div>value is {value.toString()}</div>
            <ConnectedCheckbox name={name} label='Foo' />
          </FormProvider>
        );
      }

      render(<TestComponent />);

      const element = screen.getByRole('checkbox');

      expect(screen.getByText('value is false'));

      expect(element).not.toBeChecked();

      fireEvent.click(element);

      expect(element).toBeChecked();

      expect(screen.getByText('value is true'));
    });
  });

  describe('PureCheckbox', () => {
    it('should render checkbox and register', () => {
      const name = 'foo.bar.0.baz';
      const mockOnChange = jest.fn();
      const mockOnRegister = jest.fn().mockImplementation((name, options) => {
        return {
          name,
          ...options,
          onChange: mockOnChange,
        };
      });
      const regOptions = {
        value: false,
      };

      render(
        <PureCheckbox
          name={name}
          label='Foo'
          register={mockOnRegister}
          regOptions={regOptions}
        />,
      );

      const element = screen.getByRole('checkbox');

      expect(element).not.toBeChecked();
      expect(mockOnRegister).toHaveBeenCalled();

      fireEvent.click(screen.getByLabelText('Foo'));

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should render errors', () => {
      const name = 'foo.bar.0.baz';
      const errors: FieldErrors<{ foo: { bar: { baz: string }[] } }> = {
        foo: {
          bar: [{ baz: { type: '', message: 'My Error' } }],
        },
      };
      const mockOnRegister = jest.fn();

      render(
        <PureCheckbox
          name={name}
          label='Foo'
          errors={errors}
          register={mockOnRegister}
        />,
      );

      expect(screen.getByRole('checkbox')).toHaveClass('text-red-600');
    });
  });
});
