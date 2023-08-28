import { fireEvent, render, screen } from '@testing-library/react';

import { ButtonGroup } from './ButtonGroup';

jest.mock('@relationalai/utils');

const options = [
  { value: 'foo', label: 'foo' },
  { value: 'baz', label: 'baz' },
  { value: 'goo', label: 'goo' },
];

describe('ButtonGroup', () => {
  it('should display button group with pre-selection', async () => {
    render(<ButtonGroup options={options} selected='baz' />);

    const btns = await screen.findAllByRole('button');

    expect(btns).toHaveLength(3);
    expect(btns[0]).toHaveTextContent('Foo'); // Left most button
    expect(btns[0]).toHaveClass('rounded-l-md rounded-r-none');
    expect(btns[1]).toHaveTextContent('Baz'); // In the middle button
    expect(btns[1]).toHaveClass('rounded-l-none rounded-r-none');
    expect(btns[2]).toHaveTextContent('Goo'); // Right most button
    expect(btns[2]).toHaveClass('rounded-l-none rounded-r-md');

    expect(btns[0]).toHaveAttribute('aria-checked', 'false');
    expect(btns[1]).toHaveAttribute('aria-checked', 'true');
    expect(btns[2]).toHaveAttribute('aria-checked', 'false');

    // Change active/checked button
    fireEvent.click(btns[0]);

    expect(btns[0]).toHaveAttribute('aria-checked', 'true');
    expect(btns[1]).toHaveAttribute('aria-checked', 'false');
    expect(btns[2]).toHaveAttribute('aria-checked', 'false');
  });

  it('onSelect should be called', async () => {
    const onSelectMock = jest.fn();

    render(
      <ButtonGroup options={options} selected='foo' onSelect={onSelectMock} />,
    );
    const btns = await screen.findAllByRole('button');

    fireEvent.click(btns[1]);
    expect(onSelectMock).toHaveBeenCalledWith('baz');

    fireEvent.click(btns[2]);
    expect(onSelectMock).toHaveBeenCalledWith('goo');
  });
});
