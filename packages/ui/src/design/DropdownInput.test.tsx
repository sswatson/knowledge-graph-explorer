import { act, fireEvent, render, screen } from '@testing-library/react';

import { Dropdown } from './Dropdown';
import { DropdownInput } from './DropdownInput';

const options = [
  { label: 'item1', value: 'item1' },
  { label: 'item2', value: 'item2' },
];

describe('DropdownInput', () => {
  it('it should render dropdown input', async () => {
    await act(() => {
      render(
        <Dropdown
          options={options}
          testIdPrefix='test'
          placeholderText='placeholder text'
          displayValue='display value'
          search
          triggerElement={<DropdownInput />}
        />,
      );
    });

    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  it('it should call onFocus', async () => {
    const onFocus = jest.fn();

    await act(() => {
      render(
        <Dropdown
          options={options}
          testIdPrefix='test'
          placeholderText='placeholder text'
          displayValue='display value'
          search
          triggerElement={<DropdownInput onFocus={onFocus} />}
        />,
      );
    });

    const inputElement = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.focus(inputElement);
    });

    expect(onFocus).toHaveBeenCalled();
  });

  it('it should call onBlur', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();

    await act(() => {
      render(
        <Dropdown
          options={options}
          testIdPrefix='test'
          placeholderText='placeholder text'
          displayValue='display value'
          search
          triggerElement={<DropdownInput onFocus={onFocus} onBlur={onBlur} />}
        />,
      );
    });

    const inputElement = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.focus(inputElement);
    });

    await act(async () => {
      fireEvent.blur(inputElement);
    });

    expect(onBlur).toHaveBeenCalled();
  });

  it('should use custom className', async () => {
    await act(() => {
      render(
        <Dropdown
          options={options}
          testIdPrefix='test'
          placeholderText='placeholder text'
          displayValue='display value'
          search
          triggerElement={<DropdownInput className='bg-red-500' />}
        />,
      );
    });

    expect(screen.getByTestId('test-input')).toHaveClass('bg-red-500');
  });
});
