import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import Html from './Html';

function makeOutput(html: string[]) {
  return plainToArrow([
    {
      relationId: '/:MIME/String',
      columns: [['text/html']],
    },
    {
      relationId: '/:text/:html/String',
      columns: [html],
    },
  ]);
}

describe('Html', () => {
  it('should sanitize', () => {
    render(
      <Html relations={makeOutput(['<img src="" onclick="doHarm()" />'])} />,
    );

    const img = screen.getByRole('img');

    expect(img).toBeInTheDocument();
    expect(img.innerHTML.includes('onclick')).toEqual(false);
  });

  it('should display html', () => {
    render(<Html relations={makeOutput(['<div><h1>Foo</h1></div>'])} />);

    expect(screen.getByRole('heading')).toHaveTextContent('Foo');
  });

  it('should display multiple html strings', () => {
    render(
      <Html relations={makeOutput(['<h1>Foo</h1>', '<button>bar</button>'])} />,
    );

    expect(screen.getByRole('heading')).toHaveTextContent('Foo');
    expect(screen.getByRole('button')).toHaveTextContent('bar');
  });
});
