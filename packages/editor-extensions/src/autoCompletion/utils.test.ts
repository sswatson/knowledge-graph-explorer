import { patternMatch } from './utils';

const pattern1 = 'arm';
const pattern2 = 'ArM';
const pattern3 = 'ar_m';
const pattern4 = 'Arm';
const pattern5 = 'Argm';
const patternMatchList: Record<string, Record<string, boolean>> = {
  ['argMax']: {
    [pattern1]: true,
    [pattern2]: false,
    [pattern3]: false,
    [pattern4]: false,
    [pattern5]: false,
  },
  ['argmax']: {
    [pattern1]: false,
    [pattern2]: false,
    [pattern3]: false,
    [pattern4]: false,
    [pattern5]: false,
  },
  ['argmin']: {
    [pattern1]: false,
    [pattern2]: false,
    [pattern3]: false,
    [pattern4]: false,
    [pattern5]: false,
  },
  ['ArgMax']: {
    [pattern1]: false,
    [pattern2]: true,
    [pattern3]: false,
    [pattern4]: true,
    [pattern5]: false,
  },
  ['ArgMin']: {
    [pattern1]: false,
    [pattern2]: true,
    [pattern3]: false,
    [pattern4]: true,
    [pattern5]: false,
  },
  ['arg_max']: {
    [pattern1]: true,
    [pattern2]: false,
    [pattern3]: true,
    [pattern4]: false,
    [pattern5]: false,
    ['ar_Ma']: true,
  },
  ['arg_min']: {
    [pattern1]: true,
    [pattern2]: false,
    [pattern3]: true,
    [pattern4]: false,
    [pattern5]: false,
    ['ar_mi']: true,
  },
  ['Argmax']: {
    [pattern1]: false,
    [pattern2]: false,
    [pattern3]: false,
    [pattern4]: false,
    [pattern5]: true,
  },
  ['Argmin']: {
    [pattern1]: false,
    [pattern2]: false,
    [pattern3]: false,
    [pattern4]: false,
    [pattern5]: true,
  },
};

const patternTestList = Object.entries(patternMatchList).reduce(
  (curr: [string, string, boolean][], [str, patterns]) => [
    ...curr,
    ...Object.entries(patterns).map(([pattern, result]): [
      string,
      string,
      boolean,
    ] => [str, pattern, result]),
  ],
  [],
);

describe('autoCompletion utils', () => {
  test.each(patternTestList)(
    'should match %p with %p as %p',
    (str: string, pattern: string, result: boolean) => {
      expect(patternMatch(pattern, str)).toEqual(result);
    },
  );
});
