import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { DisplayMode } from './DisplayMode';
import { Output } from './Output';
import { RELATION_SIZE_THRESHOLD } from './outputUtils';

describe('Output', () => {
  it('should display physical mode', () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int64/:bar/String',
        columns: [
          [1, 2, 3],
          ['a', 'b', 'c'],
        ],
      },
    ]);

    render(<Output relations={relations} mode={DisplayMode.PHYSICAL} />);

    expect(screen.getByTestId('physical-mode')).toBeInTheDocument();
  });

  it('should display logical mode', () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int64/:bar/String',
        columns: [
          [1, 2, 3],
          ['a', 'b', 'c'],
        ],
      },
    ]);

    render(<Output relations={relations} mode={DisplayMode.LOGICAL} />);

    expect(screen.getByTestId('logical-output')).toBeInTheDocument();
  });

  it('should display raw mode', () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int64/:bar/String',
        columns: [
          [1, 2, 3],
          ['a', 'b', 'c'],
        ],
      },
    ]);

    render(<Output relations={relations} mode={DisplayMode.RAW} />);

    expect(screen.getByTestId('raw-mode')).toBeInTheDocument();
  });

  it('should display partitioned horizontal mode', () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int64/:bar/String',
        columns: [
          [1, 2, 3],
          ['a', 'b', 'c'],
        ],
      },
    ]);

    render(
      <Output
        relations={relations}
        mode={DisplayMode.PARTITIONED_HORIZONTAL}
      />,
    );

    expect(
      screen.getByTestId('partitioned-horizontal-mode'),
    ).toBeInTheDocument();
  });

  it('should display partitioned vertical mode', () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int64/:bar/String',
        columns: [
          [1, 2, 3],
          ['a', 'b', 'c'],
        ],
      },
    ]);

    render(
      <Output relations={relations} mode={DisplayMode.PARTITIONED_VERTICAL} />,
    );

    expect(screen.getByTestId('partitioned-vertical-mode')).toBeInTheDocument();
  });

  it('should display error when rows threshold is exceeded no mime', () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int64',
        columns: [
          Array.from<number>({ length: RELATION_SIZE_THRESHOLD + 1 }).fill(1),
        ],
      },
    ]);

    render(<Output relations={relations} mode={DisplayMode.LOGICAL} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      /^All results limited to the first/,
    );
    expect(screen.queryByTestId('logical-output')).toBeInTheDocument();
  });

  it('should display error when rows threshold is exceeded with mime', () => {
    const relations = plainToArrow([
      { relationId: '/:MIME/String', columns: [['text/html']] },
      {
        relationId: '/:text/:html/String',
        columns: [
          Array.from<string>({ length: RELATION_SIZE_THRESHOLD + 1 }).fill(
            '<div/>',
          ),
        ],
      },
    ]);

    render(<Output relations={relations} mode={DisplayMode.LOGICAL} />);

    expect(screen.getByRole('alert')).toHaveTextContent('exceeded');
    expect(screen.queryByTestId('html-mime')).not.toBeInTheDocument();
  });

  test.each(Object.values(DisplayMode))(
    'should display empty logical output when no relations for %p mode',
    displayMode => {
      render(<Output relations={[]} mode={displayMode} />);
      expect(screen.getByTestId('logical-output')).toBeInTheDocument();
      expect(screen.getByText('No Rows To Show')).toBeInTheDocument();
    },
  );
});
