import { render, screen } from '@testing-library/react';

import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('should render markdown', () => {
    render(<Markdown value='### Foo' />);

    expect(screen.getByRole('heading')).toHaveTextContent('Foo');
  });

  it('should render LaTeX', () => {
    const { container } = render(<Markdown value='$\\sqrt{\\mathstrut a}$' />);

    expect(container.querySelector('.katex-html')).toBeInTheDocument();
  });

  it('should handle LaTeX render errors', () => {
    render(<Markdown value='$\end{matrix}$' />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('KaTeX parse error:', { exact: false }),
    ).toBeInTheDocument();
  });
});
