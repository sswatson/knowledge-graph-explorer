import { fireEvent, render, screen } from '@testing-library/react';

import { ErrorFallbackProps, withErrorBoundary } from './withErrorBoundary';

describe('withErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should catch exceptions', () => {
    const TestCmp = withErrorBoundary(({ n }: { n: number }) => {
      if (n > 1) {
        throw new Error('error');
      }

      return <div>foo</div>;
    });

    const { rerender } = render(<TestCmp n={0} />);

    expect(screen.queryByText('foo')).toBeInTheDocument();

    rerender(<TestCmp n={42} />);

    expect(screen.queryByText('foo')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Internal exception occurred while rendering.'),
    ).toBeInTheDocument();
  });

  it('should be able to try again', () => {
    const TestCmp = withErrorBoundary(({ n }: { n: number }) => {
      if (n > 1) {
        throw new Error('error');
      }

      return <div>foo</div>;
    });

    const { rerender } = render(<TestCmp n={2} />);

    expect(screen.queryByText('foo')).not.toBeInTheDocument();

    rerender(<TestCmp n={0} />);

    expect(screen.queryByText('foo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.queryByText('foo')).toBeInTheDocument();
  });

  it('should be able to use custom fallback', () => {
    const FallbackCmp = ({ error }: ErrorFallbackProps) => {
      return <div>fallback{error.message}</div>;
    };

    const TestCmp = withErrorBoundary(({ n }: { n: number }) => {
      if (n > 1) {
        throw new Error('_error');
      }

      return <div>foo</div>;
    }, FallbackCmp);

    const { rerender } = render(<TestCmp n={0} />);

    expect(screen.queryByText('foo')).toBeInTheDocument();

    rerender(<TestCmp n={42} />);

    expect(screen.queryByText('foo')).not.toBeInTheDocument();
    expect(screen.queryByText('fallback_error')).toBeInTheDocument();
  });
});
