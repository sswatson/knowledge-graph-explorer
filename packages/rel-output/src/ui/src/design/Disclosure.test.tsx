import { fireEvent, render, screen } from '@testing-library/react';

import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('should open and close', () => {
    render(
      <Disclosure title='test title'>
        <div data-testid='inner-div' />
      </Disclosure>,
    );

    expect(screen.getByTestId('inner-div')).toBeInTheDocument();
    fireEvent.click(screen.getByText('test title'));
    expect(screen.queryByTestId('inner-div')).not.toBeInTheDocument();
  });

  it('should be closed initially', () => {
    render(
      <Disclosure title='test title' defaultOpen={false}>
        <div data-testid='inner-div' />
      </Disclosure>,
    );

    expect(screen.queryByTestId('inner-div')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('test title'));
    expect(screen.getByTestId('inner-div')).toBeInTheDocument();
  });
});
