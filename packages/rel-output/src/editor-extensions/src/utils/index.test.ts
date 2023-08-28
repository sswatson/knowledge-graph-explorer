import { trimRel } from '@relationalai/utils';

import { RelDefinition } from '../types';
import { getRelDefinitions } from './index';

const modelName = 'modelName';
const databaseName = 'databaseName';

const definitionsList: Record<string, RelDefinition[]> = {
  [trimRel(`
    def test1 = 1,2
    def test1:rel_name = 5
    def test1 = 3
    def test2 = 4`)]: [
    {
      name: 'test1',
      type: 'relation',
      reference: {
        name: modelName,
        type: 'model',
        databaseName: databaseName,
        from: 4,
        to: 9,
        line: 1,
        column: 4,
      },
    },
    {
      name: 'test1:rel_name',
      type: 'relation',
      reference: {
        name: modelName,
        type: 'model',
        databaseName: databaseName,
        from: 20,
        to: 34,
        line: 2,
        column: 4,
      },
    },
    {
      name: 'test1',
      type: 'relation',
      reference: {
        name: modelName,
        type: 'model',
        databaseName: databaseName,
        from: 43,
        to: 48,
        line: 3,
        column: 4,
      },
    },
    {
      name: 'test2',
      type: 'relation',
      reference: {
        name: modelName,
        type: 'model',
        databaseName: databaseName,
        from: 57,
        to: 62,
        line: 4,
        column: 4,
      },
    },
  ],
  [trimRel(`
  module moduleTest
      def test1 = 1,2
      module subModuleTest
          def test2 = 3
          value type test3 = Int
      end
  end`)]: [
    {
      name: 'moduleTest',
      type: 'module',
      reference: {
        name: modelName,
        type: 'model',
        databaseName: databaseName,
        from: 7,
        to: 17,
        line: 1,
        column: 7,
      },
      children: [
        {
          name: 'test1',
          type: 'relation',
          reference: {
            name: modelName,
            type: 'model',
            databaseName: databaseName,
            from: 26,
            to: 31,
            line: 2,
            column: 8,
          },
        },
        {
          name: 'subModuleTest',
          type: 'module',
          reference: {
            name: modelName,
            type: 'model',
            databaseName: databaseName,
            from: 49,
            to: 62,
            line: 3,
            column: 11,
          },
          children: [
            {
              name: 'test2',
              type: 'relation',
              reference: {
                name: modelName,
                type: 'model',
                databaseName: databaseName,
                from: 75,
                to: 80,
                line: 4,
                column: 12,
              },
            },
            {
              name: '^test3',
              type: 'constructor',
              reference: {
                name: modelName,
                type: 'model',
                databaseName: databaseName,
                from: 104,
                to: 109,
                line: 5,
                column: 19,
              },
            },
            {
              name: 'test3',
              type: 'relation',
              reference: {
                name: modelName,
                type: 'model',
                databaseName: databaseName,
                from: 104,
                to: 109,
                line: 5,
                column: 19,
              },
            },
          ],
        },
      ],
    },
  ],
};

describe('editor extensions utils', () => {
  test.each(Object.entries(definitionsList))(
    'should get definitions for %p',
    (relCode: string, result: RelDefinition[]) => {
      expect(
        getRelDefinitions(relCode, {
          name: modelName,
          type: 'model',
          databaseName,
        }),
      ).toEqual(result);
    },
  );
});
