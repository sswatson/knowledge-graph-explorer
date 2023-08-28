import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import Svg from './Svg';

const sampleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" onclick="alert('foo')">
  <circle r="100" cx="100" cy="100" full="blue" />
</svg>
`;

const sampleSvg2 = `
  <circle r="100" cx="100" cy="100" full="blue" onclick="alert('foo') />
`;

function makeOutput(svg: string) {
  return plainToArrow([
    {
      relationId: '/:MIME/String',
      columns: [['image/svg+xml']],
    },
    {
      relationId: '/:image/:svg/String',
      columns: [[svg]],
    },
  ]);
}

describe('Svg', () => {
  it('should sanitize svg', () => {
    render(<Svg relations={makeOutput(sampleSvg)} />);

    const svg = screen.getByRole('img');

    expect(svg).toBeInTheDocument();
    expect(svg.innerHTML.includes('onclick')).toEqual(false);
  });

  it('should sanitize when no svg tag provided', () => {
    render(<Svg relations={makeOutput(sampleSvg2)} />);

    const svg = screen.getByRole('img');

    expect(svg).toBeInTheDocument();
    expect(svg.innerHTML.includes('onclick')).toEqual(false);
  });

  it('should display multiple svgs', () => {
    render(<Svg relations={makeOutput(sampleSvg)} />);

    const svg = screen.getByRole('img');

    expect(svg).toBeInTheDocument();
    expect(svg.innerHTML.includes('onclick')).toEqual(false);
  });
});
