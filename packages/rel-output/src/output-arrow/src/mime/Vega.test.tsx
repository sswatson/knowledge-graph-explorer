import { render, screen, waitFor, within } from '@testing-library/react';
import embed from 'vega-embed';

import { plainToArrow } from '@relationalai/utils';

import Vega from './Vega';

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.mock('vega-embed');
jest.mocked(embed).mockImplementation(jest.requireActual('vega-embed').embed);

describe('Vega', () => {
  const mockCopy = jest.fn();

  Object.assign(navigator, {
    clipboard: {
      writeText: mockCopy,
    },
  });

  describe('application/vnd.rel.relation.plot.vegalite.v5', () => {
    describe('valid spec', () => {
      const specOutput = plainToArrow([
        { relationId: '/:plot/:vegalite/:mark/String', columns: [['bar']] },
        {
          relationId: '/:plot/:vegalite/:data/:[]/Int64/:a/String',
          columns: [
            [1, 2],
            ['A', 'B'],
          ],
        },
        {
          relationId: '/:plot/:vegalite/:data/:[]/Int64/:b/Int64',
          columns: [
            [1, 1],
            [2, 2],
          ],
        },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vegalite.v5']],
        },
      ]);

      it('should render a vega lite chart', async () => {
        render(<Vega relations={specOutput} />);

        await waitFor(() => screen.getByRole('graphics-document'));

        expect(screen.queryByRole('graphics-document')).toBeInTheDocument();

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        await waitFor(() =>
          expect(
            screen.queryByTitle('Click to view actions'),
          ).toBeInTheDocument(),
        );
      });
    });

    describe('invalid spec', () => {
      const specOutput = plainToArrow([
        { relationId: '/:plot/:vegalite/:mark/String', columns: [['bar']] },
        {
          relationId: '/:plot/:vegalite/:data/:[]/Int64/:a/String',
          columns: [
            [1, 2],
            ['A', 'B'],
          ],
        },
        {
          relationId: '/:plot/:vegalite/:data/:[]/Int64/:b/Int64',
          columns: [
            [1, 1],
            [2, 2],
          ],
        },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vegalite.v5']],
        },
      ]);

      it('should display error alert', async () => {
        jest
          .mocked(embed)
          .mockRejectedValueOnce(new Error('Vega Spec Error Message.'));
        render(<Vega relations={specOutput} />);

        await waitFor(() => {
          const alert = screen.getByRole('alert');

          expect(
            within(alert).queryByText('Error: Vega Spec Error Message.', {
              exact: false,
            }),
          ).toBeInTheDocument();
          expect(
            within(alert).queryByText('There is an error in the vega spec.', {
              exact: false,
            }),
          ).toBeInTheDocument();
          expect(
            within(alert).queryByRole('link', { name: 'vega editor' }),
          ).toHaveAttribute(
            'href',
            'https://vega.github.io/editor/#/custom/vega-lite',
          );
          expect(
            within(alert).queryByTestId('copy-spec-btn'),
          ).toBeInTheDocument();
        });

        screen.getByTestId('copy-spec-btn').click();
        await waitFor(() => {
          expect(mockCopy).toHaveBeenCalledWith(
            JSON.stringify(
              {
                mark: 'bar',
                data: [{ a: 'A', b: 2 }, { a: 'B' }],
              },
              undefined,
              2,
            ),
          );
        });

        expect(screen.queryByRole('graphics-document')).not.toBeInTheDocument();
        jest.clearAllMocks();
      });
    });

    describe('mismatch version', () => {
      const specOutput = plainToArrow([
        { relationId: '/:plot/:vegalite/:mark/String', columns: [['bar']] },
        {
          relationId: '/:plot/:vegalite/:data/:[]/Int64/:a/String',
          columns: [
            [1, 2],
            ['A', 'B'],
          ],
        },
        {
          relationId: '/:plot/:vegalite/:data/:[]/Int64/:b/Int64',
          columns: [
            [1, 1],
            [2, 2],
          ],
        },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vegalite.v4']],
        },
      ]);

      it('should render a vega lite chart with a warning', async () => {
        render(<Vega relations={specOutput} />);

        await waitFor(() => screen.getByRole('graphics-document'));

        expect(screen.queryByRole('graphics-document')).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.queryByRole('alert')).toBeInTheDocument();
          expect(
            screen.getByText(
              'Warning: Specification requested vega-lite version 4, but rendering with version 5',
            ),
          ).toBeInTheDocument();
        });
      });
    });

    describe('empty spec', () => {
      const specOutput = plainToArrow([
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vegalite.v5']],
        },
      ]);

      it('should dispatch an error', async () => {
        render(<Vega relations={specOutput} />);

        await waitFor(() => {
          expect(screen.queryByRole('alert')).toBeInTheDocument();
          expect(
            screen.getByText('Invalid specification', { exact: false }),
          ).toBeInTheDocument();
          expect(screen.queryByTestId('copy-spec-btn')).toBeInTheDocument();
        });

        screen.getByTestId('copy-spec-btn').click();
        await waitFor(() => {
          expect(mockCopy).toHaveBeenCalledWith('{}');
        });

        expect(screen.queryByRole('graphics-document')).not.toBeInTheDocument();
      });
    });
  });

  describe('application/vnd.rel.relation.plot.vega.v5', () => {
    describe('valid spec', () => {
      const specOutput = plainToArrow([
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:domain/:data/String',
          columns: [
            [1, 2],
            ['table', 'table'],
          ],
        },
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:name/String',
          columns: [
            [1, 2],
            ['xscale', 'yscale'],
          ],
        },
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:domain/:field/String',
          columns: [
            [1, 2],
            ['x', 'amount'],
          ],
        },
        {
          relationId: '/:plot/:vega/:data/:[]/Int64/:values/:[]/Int64/:x/Int64',
          columns: [
            [1, 1],
            [1, 2],
            [1, 2],
          ],
        },
        { relationId: '/:plot/:vega/:width/Int64', columns: [[200]] },
        { relationId: '/:plot/:vega/:height/Int64', columns: [[200]] },
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:range/String',
          columns: [
            [1, 2],
            ['width', 'height'],
          ],
        },
        {
          relationId: '/:plot/:vega/:data/:[]/Int64/:name/String',
          columns: [[1], ['table']],
        },
        {
          relationId:
            '/:plot/:vega/:data/:[]/Int64/:values/:[]/Int64/:amount/Int64',
          columns: [
            [1, 1],
            [1, 2],
            [28, 55],
          ],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:x/:field/String',
          columns: [[1], ['x']],
        },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vega.v5']],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:y/:scale/String',
          columns: [[1], ['yscale']],
        },
        {
          relationId: '/:plot/:vega/:marks/:[]/Int64/:type/String',
          columns: [[1], ['line']],
        },
        {
          relationId: '/:plot/:vega/:marks/:[]/Int64/:from/:data/String',
          columns: [[1], ['table']],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:x/:scale/String',
          columns: [[1], ['xscale']],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:y/:field/String',
          columns: [[1], ['amount']],
        },
      ]);

      it('should render a vega chart', async () => {
        render(<Vega relations={specOutput} />);

        await waitFor(() => screen.getByRole('graphics-document'));

        expect(screen.queryByRole('graphics-document')).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
      });
    });

    describe('invalid spec', () => {
      const specOutput = plainToArrow([
        {
          relationId: '/:plot/:vega/:data/:[]/Int64/:values/:[]/Int64/:x/Int64',
          columns: [
            [1, 1],
            [1, 2],
            [1, 2],
          ],
        },
        {
          relationId: '/:plot/:vega/:data/:[]/Int64/:name/String',
          columns: [[1], ['table']],
        },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vega.v5']],
        },
      ]);

      it('should display error alert', async () => {
        jest
          .mocked(embed)
          .mockRejectedValueOnce(new Error('Vega Spec Error Message.'));
        render(<Vega relations={specOutput} />);

        await waitFor(() => {
          const alert = screen.getByRole('alert');

          expect(
            within(alert).queryByText('Error: Vega Spec Error Message.', {
              exact: false,
            }),
          ).toBeInTheDocument();
          expect(
            within(alert).queryByText('There is an error in the vega spec.', {
              exact: false,
            }),
          ).toBeInTheDocument();
          expect(
            within(alert).queryByRole('link', { name: 'vega editor' }),
          ).toHaveAttribute(
            'href',
            'https://vega.github.io/editor/#/custom/vega',
          );
          expect(
            within(alert).queryByTestId('copy-spec-btn'),
          ).toBeInTheDocument();
        });

        screen.getByTestId('copy-spec-btn').click();
        await waitFor(() => {
          expect(mockCopy).toHaveBeenCalledWith(
            JSON.stringify(
              {
                data: [
                  {
                    values: [{ x: 1 }, { x: 2 }],
                    name: 'table',
                  },
                ],
              },
              undefined,
              2,
            ),
          );
        });

        expect(screen.queryByRole('graphics-document')).not.toBeInTheDocument();
        jest.clearAllMocks();
      });
    });

    describe('mismatch version', () => {
      const specOutput = plainToArrow([
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:domain/:data/String',
          columns: [
            [1, 2],
            ['table', 'table'],
          ],
        },
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:name/String',
          columns: [
            [1, 2],
            ['xscale', 'yscale'],
          ],
        },
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:domain/:field/String',
          columns: [
            [1, 2],
            ['x', 'amount'],
          ],
        },
        {
          relationId: '/:plot/:vega/:data/:[]/Int64/:values/:[]/Int64/:x/Int64',
          columns: [
            [1, 1],
            [1, 2],
            [1, 2],
          ],
        },
        { relationId: '/:plot/:vega/:width/Int64', columns: [[200]] },
        { relationId: '/:plot/:vega/:height/Int64', columns: [[200]] },
        {
          relationId: '/:plot/:vega/:scales/:[]/Int64/:range/String',
          columns: [
            [1, 2],
            ['width', 'height'],
          ],
        },
        {
          relationId: '/:plot/:vega/:data/:[]/Int64/:name/String',
          columns: [[1], ['table']],
        },
        {
          relationId:
            '/:plot/:vega/:data/:[]/Int64/:values/:[]/Int64/:amount/Int64',
          columns: [
            [1, 1],
            [1, 2],
            [28, 55],
          ],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:x/:field/String',
          columns: [[1], ['x']],
        },
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vega.v4']],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:y/:scale/String',
          columns: [[1], ['yscale']],
        },
        {
          relationId: '/:plot/:vega/:marks/:[]/Int64/:type/String',
          columns: [[1], ['line']],
        },
        {
          relationId: '/:plot/:vega/:marks/:[]/Int64/:from/:data/String',
          columns: [[1], ['table']],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:x/:scale/String',
          columns: [[1], ['xscale']],
        },
        {
          relationId:
            '/:plot/:vega/:marks/:[]/Int64/:encode/:enter/:y/:field/String',
          columns: [[1], ['amount']],
        },
      ]);

      it('should render a vega lite chart with a warning', async () => {
        render(<Vega relations={specOutput} />);

        await waitFor(() => screen.getByRole('graphics-document'));

        expect(screen.queryByRole('graphics-document')).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.queryByRole('alert')).toBeInTheDocument();
          expect(
            screen.getByText(
              'Specification requested vega version 4, but rendering with version 5',
              { exact: false },
            ),
          ).toBeInTheDocument();
        });
      });
    });

    describe('empty spec', () => {
      const specOutput = plainToArrow([
        {
          relationId: '/:MIME/String',
          columns: [['application/vnd.rel.relation.plot.vega.v5']],
        },
      ]);

      it('should plot nothing', async () => {
        render(<Vega relations={specOutput} />);

        await waitFor(() => screen.getByRole('graphics-document'));

        expect(screen.queryByRole('graphics-document')).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
      });
    });
  });
});
