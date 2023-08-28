import { render, screen } from '@testing-library/react';

import { plainToArrow } from '@relationalai/utils';

import Json from './Json';

describe('Json', () => {
  it('should display json', () => {
    const relations = plainToArrow([
      {
        relationId: '/:MIME/String',
        columns: [['application/vnd.rel.relation.json']],
      },
      {
        relationId: '/:json/:data/:foo/String',
        columns: [['bar']],
      },
      {
        relationId: '/:json/:data/:bar/Int64',
        columns: [[123]],
      },
      {
        relationId: '/:json/:data/:baz/:[]/Int64/String',
        columns: [
          [1, 2],
          ['a', 'b'],
        ],
      },
    ]);

    render(<Json relations={relations} />);

    const element = screen.getByRole('textbox');
    const expectedResult = {
      foo: 'bar',
      bar: 123,
      baz: ['a', 'b'],
    };

    expect(JSON.parse(element.textContent || '{}')).toEqual(expectedResult);
  });
});
