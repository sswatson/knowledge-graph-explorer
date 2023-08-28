import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { LogicalMode } from './LogicalMode';

jest.mock('../MimeElement', () => ({
  MimeElement: () => <div>MimeElement</div>,
}));

const relations = plainToArrow([
  { relationId: '/:bar/:baz/Int64', columns: [[1, 2]] },
  { relationId: '/:bar/String', columns: [['a', 'b']] },
  { relationId: '/:bar/String/Int64/Char', columns: [['d'], [65], [65]] },
]);

describe('LogicalMode', () => {
  it('should display relations', async () => {
    render(<LogicalMode relations={relations} />);
    expect(screen.getByTestId('logical-output')).toBeInTheDocument();
  });

  it('should display mime element when mime type is defined', () => {
    render(<LogicalMode relations={relations} mimeType='text/html' />);
    expect(screen.getByText('MimeElement')).toBeInTheDocument();
  });

  it('should not render when no relations is passed', () => {
    render(<LogicalMode relations={[]} />);
    expect(screen.queryByTestId('logical-output')).not.toBeInTheDocument();
    expect(screen.queryByText('mime-element')).not.toBeInTheDocument();
  });
});
