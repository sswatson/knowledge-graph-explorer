import { act, fireEvent, render, screen } from '@testing-library/react';

import { DateTimePicker } from './DateTimePicker';

const waitForFloating = () => act(async () => {});

describe('DateTimePicker', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2023, 6, 1, 12, 0));
  });

  it('should display selected value', async () => {
    render(
      <DateTimePicker name={'foo'} value={new Date(2021, 0, 10, 14, 12)} />,
    );

    await waitForFloating();

    expect(screen.getByText('2021-1-10 2:12 PM')).toBeInTheDocument();

    await act(() => {
      fireEvent.click(screen.getByTestId('foo-trigger'));
    });

    const header = screen.getAllByText('2021')[0].parentElement;

    expect(header).toHaveTextContent('January,2021');
    expect(screen.getAllByText('10')[0].parentElement).toHaveClass(
      'rmdp-selected',
    );
  });

  it('should display current month when no selection', async () => {
    render(<DateTimePicker name={'foo'} placeholder='Select value' />);

    await waitForFloating();

    await act(() => {
      fireEvent.click(screen.getByText('Select value'));
    });

    const header = screen.getAllByText('2023')[0].parentElement;

    expect(header).toHaveTextContent('July,2023');
    expect(screen.getAllByText('1')[0].parentElement).toHaveClass('rmdp-today');
  });

  it('should change value', async () => {
    const onChangeMock = jest.fn();

    render(
      <DateTimePicker
        name={'foo'}
        placeholder='Select value'
        onChange={onChangeMock}
      />,
    );

    await waitForFloating();

    await act(() => {
      fireEvent.click(screen.getByText('Select value'));
    });

    fireEvent.click(screen.getAllByText('10')[0]);

    expect(onChangeMock).toHaveBeenCalledWith(new Date(2023, 6, 10, 12, 0));
  });

  it('should change value with time', async () => {
    const onChangeMock = jest.fn();

    render(
      <DateTimePicker
        name={'foo'}
        placeholder='Select value'
        onChange={onChangeMock}
        enableTimePicker={true}
      />,
    );

    await waitForFloating();

    await act(() => {
      fireEvent.click(screen.getByText('Select value'));
    });

    fireEvent.click(screen.getByText('10'));

    const hoursInput = screen.getAllByRole('textbox')[0];

    expect(hoursInput).toHaveAttribute('name', 'hour');

    fireEvent.change(hoursInput, {
      target: {
        value: '5',
      },
    });

    const minutesInput = screen.getAllByRole('textbox')[1];

    expect(minutesInput).toHaveAttribute('name', 'minute');

    fireEvent.change(minutesInput, {
      target: {
        value: '30',
      },
    });

    fireEvent.click(screen.getByText('Done'));

    expect(onChangeMock).toHaveBeenCalledWith(new Date(2023, 6, 10, 5, 30));
  });

  it('should handle clear', async () => {
    const onChangeMock = jest.fn();

    render(
      <DateTimePicker
        name={'foo'}
        value={new Date(2021, 0, 10, 14, 12)}
        onChange={onChangeMock}
      />,
    );

    await waitForFloating();

    await act(() => {
      fireEvent.click(screen.getByTestId('foo-trigger'));
    });

    fireEvent.click(screen.getByText('Clear'));

    expect(onChangeMock).toHaveBeenLastCalledWith(undefined);
  });

  it('should handle range selection', async () => {
    const onChangeMock = jest.fn();

    render(<DateTimePicker name={'foo'} onChange={onChangeMock} range />);

    await waitForFloating();

    await act(() => {
      fireEvent.click(screen.getByTestId('foo-trigger'));
    });

    fireEvent.click(screen.getByText('10'));

    expect(onChangeMock).toHaveBeenNthCalledWith(1, [
      new Date(2023, 6, 10, 12, 0),
    ]);

    fireEvent.click(screen.getByText('13'));

    ['10', '11', '12', '13'].forEach(day => {
      expect(screen.getByText(day).parentElement).toHaveClass('rmdp-range');
    });

    expect(onChangeMock).toHaveBeenNthCalledWith(2, [
      new Date(2023, 6, 10, 12),
      new Date(2023, 6, 13, 12),
    ]);
  });
});
