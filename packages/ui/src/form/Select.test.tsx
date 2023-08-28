import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PureSelect } from './Select';

const people = [
  { value: 1, label: 'Durward Reynolds' },
  { value: 2, label: 'Kenton Towne' },
  { value: 3, label: 'Therese Wunsch' },
  { value: 4, label: 'Benedict Kessler' },
  { value: 5, label: 'Katelyn Rohan' },
];

const waitForFloating = () => act(async () => {});

describe('Select', () => {
  it('should display selected value', async () => {
    render(
      <PureSelect
        name=''
        value={3}
        inputRef={_ => {}}
        options={people}
        onSelect={jest.fn()}
      />,
    );

    await waitForFloating();

    expect(screen.getByText('Therese Wunsch')).toBeInTheDocument();
  });

  it('should display options', async () => {
    const user = userEvent.setup();

    render(
      <PureSelect
        name='foo'
        value={3}
        inputRef={_ => {}}
        options={people}
        onSelect={jest.fn()}
      />,
    );

    expect(
      screen.queryByRole('option', { name: 'Durward Reynolds' }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId('foo-trigger'));
    });

    expect(
      screen.queryByRole('option', { name: 'Durward Reynolds' }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('option').length).toEqual(people.length);
  });

  it('should select option', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    render(
      <PureSelect
        name='foo'
        value={3}
        inputRef={_ => {}}
        options={people}
        onSelect={mockOnSelect}
      />,
    );

    await act(async () => {
      await user.click(screen.getByTestId('foo-trigger'));
    });

    await act(async () => {
      await user.click(
        screen.getByRole('option', { name: 'Durward Reynolds' }),
      );
    });

    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });

  it('should clear selected option', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    render(
      <PureSelect
        name='foo'
        value={3}
        inputRef={_ => {}}
        options={people}
        onSelect={mockOnSelect}
        isClearable={true}
      />,
    );

    await act(async () => {
      await user.click(screen.getByTestId('clear-foo'));
    });

    expect(mockOnSelect).toHaveBeenCalledWith(undefined);
  });

  it('should display placeholder when defaultValue is empty', async () => {
    const mockOnSelect = jest.fn();

    render(
      <PureSelect
        name=''
        inputRef={_ => {}}
        placeholderText='Placeholder'
        options={people}
        onSelect={mockOnSelect}
      />,
    );

    await waitForFloating();

    expect(
      screen.getByRole('button', { name: 'Placeholder' }),
    ).toBeInTheDocument();
  });

  it('should display defaultValue not placeholder', async () => {
    const mockOnSelect = jest.fn();

    render(
      <PureSelect
        name=''
        inputRef={_ => {}}
        placeholderText='Placeholder'
        options={people}
        value={people[0].value}
        onSelect={mockOnSelect}
      />,
    );

    await waitForFloating();

    expect(
      screen.getByRole('button', { name: 'Durward Reynolds' }),
    ).toBeInTheDocument();
  });

  it('should display spinner when it is loading', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    render(
      <PureSelect
        name='foo'
        value={3}
        inputRef={_ => {}}
        options={people}
        isLoading={true}
        onSelect={mockOnSelect}
      />,
    );

    await act(async () => {
      await user.click(screen.getByTestId('foo-trigger'));
    });

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should disable select if readOnly is true ', async () => {
    render(
      <PureSelect
        name=''
        readOnly
        value={3}
        inputRef={_ => {}}
        options={people}
        onSelect={jest.fn()}
      />,
    );

    await waitForFloating();

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should search when user starts typing', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    render(
      <PureSelect
        name='foo'
        value={3}
        inputRef={_ => {}}
        options={people}
        onSelect={mockOnSelect}
        search
      />,
    );

    await act(async () => {
      await user.click(screen.getByTestId('foo-trigger'));
    });

    const inputElement = screen.getByRole('combobox');

    expect(inputElement).toBeInTheDocument();

    await act(async () => await user.clear(inputElement));
    await act(async () => await user.type(inputElement, 'Durward Reynolds'));

    expect(
      screen.getByRole('option', { name: 'Durward Reynolds' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toEqual(1);
  });

  it('should display not found message', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();

    render(
      <PureSelect
        name='foo'
        value={3}
        inputRef={_ => {}}
        options={people}
        onSelect={mockOnSelect}
        search
      />,
    );

    await act(async () => {
      await user.click(screen.getByTestId('foo-trigger'));
    });

    const inputElement = screen.getByRole('combobox');

    expect(inputElement).toBeInTheDocument();

    await act(async () => await user.clear(inputElement));
    await act(async () => await user.type(inputElement, 'test'));

    expect(screen.getByText('No options found')).toBeInTheDocument();
  });
});
