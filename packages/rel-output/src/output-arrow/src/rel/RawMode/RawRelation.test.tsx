import { render, screen, waitFor } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import { RawRelation } from './RawRelation';

describe('RawRelation', () => {
  it('should render relation table', async () => {
    const relations = plainToArrow([
      {
        relationId: '/:foo/Int32/:bar/String/Char',
        columns: [
          [1, 2, 3],
          ['a', 'b', 'c'],
          [65, 66, 67],
        ],
      },
    ]);

    render(<RawRelation relation={relations[0]} />);

    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('v1');
    expect(screen.getAllByRole('columnheader')[1]).toHaveTextContent('v2');

    expect(screen.getAllByRole('columnheader')[2]).toHaveTextContent('v3');

    await waitFor(() =>
      expect(screen.getAllByRole('gridcell')[0]).toHaveTextContent('1'),
    );
    expect(screen.getAllByRole('gridcell')[1]).toHaveTextContent('a');
    expect(screen.getAllByRole('gridcell')[2]).toHaveTextContent('65');

    expect(screen.getAllByRole('gridcell')[3]).toHaveTextContent('2');
    expect(screen.getAllByRole('gridcell')[4]).toHaveTextContent('b');
    expect(screen.getAllByRole('gridcell')[5]).toHaveTextContent('66');

    expect(screen.getAllByRole('gridcell')[6]).toHaveTextContent('3');
    expect(screen.getAllByRole('gridcell')[7]).toHaveTextContent('c');
    expect(screen.getAllByRole('gridcell')[8]).toHaveTextContent('67');
  });

  it('should render relation metadata', async () => {
    const relations = plainToArrow([
      {
        relationId: 'String',
        columns: [['a']],
        metadata: {
          arguments: [{ tag: 1, primitiveType: 16 }],
        },
      },
    ]);

    render(<RawRelation relation={relations[0]} />);

    const element = screen.getByRole('textbox');

    const expectedResult = {
      arguments: [
        {
          tag: 'PRIMITIVE_TYPE',
          primitiveType: 'STRING',
        },
      ],
    };

    expect(JSON.parse(element.textContent || '{}')).toEqual(expectedResult);
  });
});
