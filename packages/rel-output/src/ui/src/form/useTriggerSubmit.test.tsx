import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode, useRef } from 'react';

import useTriggerSubmit from './useTriggerSubmit';

type TestComponentProps = {
  children?: ReactNode;
  selector?: string;
};

function TestComponent({ children, selector }: TestComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trigerSubmit = useTriggerSubmit(ref, selector);

  const handleClick = () => {
    try {
      trigerSubmit();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  return (
    <div ref={ref}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div role='button' tabIndex={0} onClick={handleClick}>
        Div Button
      </div>
      {children}
    </div>
  );
}

describe('useTriggerSubmit', () => {
  it('should trigger submit', () => {
    const mockOnSubmit = jest.fn();

    render(
      <form onSubmit={mockOnSubmit}>
        <TestComponent />
      </form>,
    );

    fireEvent.click(screen.getByText('Div Button'));

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should throw error when called outside of form', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);

    fireEvent.click(screen.getByText('Div Button'));

    expect(error).toHaveBeenCalled();

    error.mockReset();
  });

  it('should trigger submit for multiple forms using selector param', () => {
    const mockOnSubmit = jest.fn();

    render(
      <TestComponent selector='.foo'>
        <div>
          <form className='foo' onSubmit={() => mockOnSubmit('form1')}>
            <div>Form1</div>
          </form>
          <div className='foo'>not a form</div>
          <form className='foo' onSubmit={() => mockOnSubmit('form2')}>
            <div>Form2</div>
          </form>
        </div>
      </TestComponent>,
    );

    fireEvent.click(screen.getByText('Div Button'));

    expect(mockOnSubmit).toHaveBeenNthCalledWith(1, 'form1');
    expect(mockOnSubmit).toHaveBeenNthCalledWith(2, 'form2');
    expect(mockOnSubmit).toHaveBeenCalledTimes(2);
  });
});
