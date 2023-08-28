import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmitHandler, useForm, useFormContext } from 'react-hook-form';

import Form from './Form';

type Foo = {
  foo: string;
};

function getTestComponent(onSubmit: SubmitHandler<Foo>, children: JSX.Element) {
  return () => {
    const methods = useForm({
      defaultValues: {
        foo: '123',
      },
    });

    return (
      <Form hookMethods={methods} onSubmit={onSubmit}>
        {children}
      </Form>
    );
  };
}

describe('Form', () => {
  it('should provide form context', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();

    function TestChild() {
      const context = useFormContext();

      const foo = context.watch('foo');

      return (
        <div>
          <button type='submit'>Foo value is {foo}</button>
          <input type='text' {...context.register('foo')} />
        </div>
      );
    }

    const TestComponent = getTestComponent(mockOnSubmit, <TestChild />);

    render(<TestComponent />);

    expect(screen.queryByText('Foo value is 123')).toBeInTheDocument();

    const input = screen.getByRole('textbox');

    await waitFor(() => {
      expect(input).toHaveValue('123');
    });

    await act(async () => await user.type(input, '456'));

    const button = screen.getByText('Foo value is 123456');

    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        { foo: '123456' },
        expect.anything(),
      );
    });
  });
});
