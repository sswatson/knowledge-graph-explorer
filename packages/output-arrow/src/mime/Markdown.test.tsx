import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import Markdown from './Markdown';

function makeOutput(markdown: string[]) {
  return plainToArrow([
    {
      relationId: '/:MIME/String',
      columns: [['text/markdown']],
    },
    {
      relationId: '/:text/:markdown/String',
      columns: [markdown],
    },
  ]);
}

describe('Markdown', () => {
  it('should display markdown', () => {
    render(
      <Markdown
        relations={makeOutput([
          `
Code block:

    2 + 2

After code block.
    `,
        ])}
      />,
    );

    expect(screen.getByText('Code block:')).toBeInTheDocument();
    expect(screen.getByText('2 + 2')).toBeInTheDocument();
    expect(screen.getByText('After code block.')).toBeInTheDocument();
  });

  it('should support special HTML characters', () => {
    render(
      <Markdown
        relations={makeOutput([
          `
Angle brackets outside: < >

    Angle brackets inside <code> block

HTML outside: <code>R <++ S</code>

    2 <++ 3
    `,
        ])}
      />,
    );

    expect(screen.getByText('Angle brackets outside: < >')).toBeInTheDocument();
    expect(
      screen.getByText('Angle brackets inside <code> block'),
    ).toBeInTheDocument();
    expect(screen.getByText('HTML outside:')).toBeInTheDocument();
    expect(screen.getByText('R <++ S')).toBeInTheDocument();
    expect(screen.getByText('2 <++ 3')).toBeInTheDocument();
  });

  it('should render images', () => {
    render(
      <Markdown
        relations={makeOutput([
          `
# Foo
![](https://docs.relational.ai/rkgms/console/cells-new-notebook.png)
        `,
        ])}
      />,
    );

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('should display multiple markdown strings', () => {
    render(<Markdown relations={makeOutput(['# Foo', '# Bar'])} />);

    const headings = screen.getAllByRole('heading');

    expect(headings[0]).toHaveTextContent('Foo');
    expect(headings[1]).toHaveTextContent('Bar');
  });
});
