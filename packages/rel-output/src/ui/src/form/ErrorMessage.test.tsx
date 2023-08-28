import { render, screen } from '@testing-library/react';
import { FieldErrors, useFormContext } from 'react-hook-form';

import { ConnectedErrorMessage, PureErrorMessage } from './ErrorMessage';

jest.mock('react-hook-form');

const useFormContextMock = jest.mocked(useFormContext);

describe('ErrorMessage', () => {
  describe('ConnectedErrorMessage', () => {
    it('should throw an error if no form context found', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ConnectedErrorMessage name='foo' />);
      }).toThrow();

      error.mockReset();
    });

    it('should pass down error state', () => {
      const name = 'foo';

      useFormContextMock.mockReturnValue({
        formState: {
          errors: {
            foo: { message: 'My Error' },
          },
        },
      } as any);

      render(<ConnectedErrorMessage name={name} />);

      const element = screen.queryByTestId(`error-${name}`);

      expect(element).toHaveTextContent('My Error');
    });
  });

  describe('PureErrorMessage', () => {
    it('should render error when there is one', () => {
      const name = 'foo.bar.0.baz';
      const errors: FieldErrors<{ foo: { bar: { baz: string }[] } }> = {
        foo: {
          bar: [{ baz: { type: '', message: 'My Error' } }],
        },
      };

      render(<PureErrorMessage name={name} errors={errors} />);

      const element = screen.queryByTestId(`error-${name}`);

      expect(element).toHaveTextContent('My Error');
    });

    it('should not render error when there is no error', () => {
      const name = 'foo.baz';
      const errors: FieldErrors<{ foo: { bar: { baz: string }[] } }> = {
        foo: {
          bar: [{ baz: { type: '', message: 'My Error' } }],
        },
      };

      render(<PureErrorMessage name={name} errors={errors} />);

      const element = screen.queryByTestId(`error-${name}`);

      expect(element).not.toBeInTheDocument();
    });
  });
});
