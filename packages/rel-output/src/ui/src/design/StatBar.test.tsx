import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DEFAULT_COLORS, StatBar } from './StatBar';

const waitForFloating = () => act(async () => {});

describe('StatBar', () => {
  const items = [
    { value: 1, label: 'foo' },
    { value: 3, label: 'bar', color: 'red' },
  ];

  it('should display bars according to value', () => {
    render(<StatBar items={items} />);

    const fooEl = screen.getByTitle('foo: 1');
    const barEl = screen.getByTitle('bar: 3');

    expect(fooEl).toBeInTheDocument();
    expect(barEl).toBeInTheDocument();

    expect(fooEl).toHaveStyle('width: 25%;');
    expect(barEl).toHaveStyle('width: 75%;');
  });

  it('should display bar colors', () => {
    render(<StatBar items={items} />);

    const fooEl = screen.getByTitle('foo: 1');
    const barEl = screen.getByTitle('bar: 3');

    expect(fooEl).toHaveStyle(`background: ${DEFAULT_COLORS[0]}`);
    expect(barEl).toHaveStyle('background: red;');
  });

  it('should display total', () => {
    const { rerender } = render(<StatBar items={items} />);

    expect(screen.queryByText('4')).not.toBeInTheDocument();

    rerender(<StatBar items={items} showTotal />);

    expect(screen.queryByText('4')).toBeInTheDocument();
  });

  it('should show tooltips', async () => {
    render(<StatBar items={items} />);
    await waitForFloating();

    const fooEl = screen.getByTitle('foo: 1');

    expect(screen.queryByText('foo: 1')).not.toBeInTheDocument();

    userEvent.hover(fooEl);

    await waitFor(() => {
      expect(screen.queryByText('foo: 1')).toBeInTheDocument();
    });

    userEvent.unhover(fooEl);

    await waitFor(() => {
      expect(screen.queryByText('foo: 1')).not.toBeInTheDocument();
    });
  });

  it('should show format values', async () => {
    render(<StatBar items={items} showTotal format={val => `_${val}_`} />);

    const fooEl = screen.getByTitle('foo: _1_');

    userEvent.hover(fooEl);

    await waitFor(() => {
      expect(screen.queryByText('foo: _1_')).toBeInTheDocument();
    });

    userEvent.unhover(fooEl);

    await waitFor(() => {
      expect(screen.queryByText('foo: 1')).not.toBeInTheDocument();
    });

    await waitForFloating();
    // total
    expect(screen.queryByText('_4_')).toBeInTheDocument();
  });
});
