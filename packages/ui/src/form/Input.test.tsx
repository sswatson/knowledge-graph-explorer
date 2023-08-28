import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldErrors, FormProvider, useForm } from 'react-hook-form';

import { copyToClipboard } from '@relationalai/utils';

import { ConnectedInput, PureInput } from './Input';

jest.mock('@relationalai/utils');

const copyToClipboardMock = jest.mocked(copyToClipboard);

describe('Input', () => {
  describe('ConnectedInput', () => {
    it('should throw an error if no form context found', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ConnectedInput name='foo' />);
      }).toThrow();
      error.mockReset();
    });

    it('should connect pure input to form', async () => {
      const name = 'foo';
      const user = userEvent.setup();

      function TestComponent() {
        const methods = useForm({
          mode: 'onChange',
          defaultValues: {
            foo: '123',
          },
        });

        const value = methods.watch(name);

        return (
          <FormProvider {...methods}>
            <div>value is {value}</div>
            <ConnectedInput
              name={name}
              regOptions={{
                maxLength: {
                  value: 5,
                  message: 'Max 5',
                },
              }}
            />
          </FormProvider>
        );
      }

      render(<TestComponent />);

      const element = screen.getByRole('textbox');

      expect(element).toHaveValue('123');
      expect(
        screen.queryByTestId(`input-error-icon-${name}`),
      ).not.toBeInTheDocument();

      await act(async () => await user.type(element, '456'));

      await waitFor(() => expect(element).toHaveValue('123456'));
      await waitFor(() =>
        expect(
          screen.queryByTestId(`input-error-icon-${name}`),
        ).toBeInTheDocument(),
      );
      expect(screen.getByText('value is 123456'));
    });
  });

  describe('PureInput', () => {
    it('should render text input and register', async () => {
      const name = 'foo.bar.0.baz';
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      const mockOnRegister = jest.fn().mockImplementation((name, options) => {
        return {
          name,
          ...options,
          onChange: mockOnChange,
        };
      });
      const regOptions = {
        value: 'my-value',
      };

      render(
        <PureInput
          name={name}
          register={mockOnRegister}
          regOptions={regOptions}
        />,
      );

      const element = screen.getByRole('textbox');

      expect(element).toHaveValue('my-value');
      expect(mockOnRegister).toHaveBeenCalled();
      expect(
        screen.queryByTestId(`input-error-icon-${name}`),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(`input-copy-icon-${name}`),
      ).not.toBeInTheDocument();

      await act(async () => await user.type(element, '-foo'));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(4);
      });
    });

    it('should render error icon', () => {
      const name = 'foo.bar.0.baz';
      const errors: FieldErrors<{ foo: { bar: { baz: string }[] } }> = {
        foo: {
          bar: [{ baz: { type: '', message: 'My Error' } }],
        },
      };
      const mockOnRegister = jest.fn();

      render(
        <PureInput name={name} errors={errors} register={mockOnRegister} />,
      );

      expect(
        screen.queryByTestId(`input-error-icon-${name}`),
      ).toBeInTheDocument();
    });

    it('should copy input value', async () => {
      const name = 'foo.bar.0.baz';
      const user = userEvent.setup();
      const mockOnRegister = jest.fn();
      const mockOnCopyToClipboard = jest.fn();

      copyToClipboardMock.mockImplementation(mockOnCopyToClipboard);

      render(
        <PureInput
          name={name}
          canCopy
          defaultValue='test-value'
          register={mockOnRegister}
        />,
      );

      const element = screen.getByTestId('copy-button');

      expect(element).toBeInTheDocument();

      await act(async () => await user.click(element));

      await waitFor(() => {
        expect(mockOnCopyToClipboard).toHaveBeenCalledWith('test-value');
      });
    });
  });
});
