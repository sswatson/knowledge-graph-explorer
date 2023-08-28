import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import Img from './Img';

const samplePng1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAKCAYAAACXDi8zAAAAAXNSR0IArs4c6QAAALhJREFUGFdFj91Kw0AUhL+TpkgiiCK9qPgWPoAv7k0ewguLeFX6s5sNtkUJ2j0jaxAPDMPMcAbG9rskfk+4C6mwYyFEFfPPmBis73sVUZBz/v9IKUnu5CHBrOLcXE5VJahHYePI53bH9/IW1RUWY5SPJw5hQ1w9c/fwCPUFFvZJ7pmPlzfsfgGVTVWbbdB66Lkevlj7EdqWxdUN1r2udMpnyhhlZ25GJWFPXScTtE3DrJ5zPLyXWfwAzGeDqxCeNmYAAAAASUVORK5CYII=';
const samplePng2 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAHCAYAAAAxrNxjAAAAAXNSR0IArs4c6QAAAQpJREFUKFMdjz1LQlEAQM+97+vq85kalEEkuFWLGGhJg0MFfRBUa0P/ojX6MUFTUGPYFkHUFDW51GAQJJmGL9+770YOZzscOOLk/MLkA5+C75NxXZRt49gWlvxHkCQJOkkQZ60bkwuytJ9f+Hzv8NMfkMsG1FfqzJVKeI47lsXW7p6ZX1zg6fGBXrfL7yhiqpAnrQSZlMtGrcpd+w3RWN8xaaXof3RIoghbQnFygs3KDJXlJsqz6X0NEPuHR2apVuP68oph/5tEx0wXi0gd4ihFs1EHz0UcHJ+aIAh4vb9Fh0N0FI0nZstlqo1VLEsyCkNEdW3bSMfFSaVxPIXQMZ6fQUg5rus4BmP4A97XW5xsO01oAAAAAElFTkSuQmCC';

const output1 = plainToArrow([
  {
    relationId: '/:MIME/String',
    columns: [['image/png']],
  },
  {
    relationId: '/:image/String',
    columns: [[samplePng1]],
  },
]);
const output2 = plainToArrow([
  {
    relationId: '/:MIME/String',
    columns: [['image/png']],
  },
  {
    relationId: '/:image/String',
    columns: [[samplePng1, samplePng2]],
  },
]);

describe('Img', () => {
  it('should display image', () => {
    render(<Img relations={output1} />);

    const img = screen.getByRole('img');

    expect(img).toHaveAttribute('src', samplePng1);
  });

  it('should display multiple images', () => {
    render(<Img relations={output2} />);

    const imgs = screen.getAllByRole('img');

    expect(imgs[0]).toHaveAttribute('src', samplePng1);
    expect(imgs[1]).toHaveAttribute('src', samplePng2);
  });
});
