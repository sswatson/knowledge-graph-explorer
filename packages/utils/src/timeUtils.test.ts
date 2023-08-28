import { getPeriodSinceDate, timeToString } from './timeUtils';

describe('timeUtils', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2022-07-01 12:00:00'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should time string', () => {
    expect(timeToString(0)).toEqual('0.00s');
    expect(timeToString(1)).toEqual('0.00s');
    expect(timeToString(12)).toEqual('0.01s');
    expect(timeToString(123)).toEqual('0.12s');
    expect(timeToString(1234)).toEqual('1.23s');
    expect(timeToString(12345)).toEqual('12.35s');
    expect(timeToString(123456)).toEqual('2m 3.46s');
    expect(timeToString(1234567)).toEqual('20m 34.57s');
    expect(timeToString(12345678)).toEqual('3h 25m 45.68s');
    expect(timeToString(123456789)).toEqual('1d 10h 17m 36.79s');

    expect(timeToString(1000)).toEqual('1.00s');
    expect(timeToString(60 * 1000)).toEqual('1m 0.00s');
    expect(timeToString(60 * 60 * 1000)).toEqual('1h 0m 0.00s');
    expect(timeToString(24 * 60 * 60 * 1000)).toEqual('1d 0h 0m 0.00s');
  });

  it('should get period since a given date', () => {
    expect(getPeriodSinceDate(new Date('2022-07-01 11:59:59'))).toEqual(
      'a second ago',
    );
    expect(getPeriodSinceDate(new Date('2022-07-01 11:59:30'))).toEqual(
      '30 seconds ago',
    );
    expect(getPeriodSinceDate(new Date('2022-07-01 11:59:00'))).toEqual(
      'a minute ago',
    );
    expect(getPeriodSinceDate(new Date('2022-07-01 11:58:50'))).toEqual(
      'a minute ago',
    );
    expect(getPeriodSinceDate(new Date('2022-07-01 11:56:50'))).toEqual(
      '3 minutes ago',
    );
    expect(getPeriodSinceDate(new Date('2022-07-01 11:00:00'))).toEqual(
      'an hour ago',
    );
    expect(getPeriodSinceDate(new Date('2022-07-01 10:50:00'))).toEqual(
      'an hour ago',
    );
    expect(getPeriodSinceDate(new Date('2022-07-01 9:50:00'))).toEqual(
      '2 hours ago',
    );
    expect(getPeriodSinceDate(new Date('2022-06-30 9:50:00'))).toEqual(
      'a day ago',
    );
    expect(getPeriodSinceDate(new Date('2022-06-29 9:50:00'))).toEqual(
      '2 days ago',
    );
    expect(getPeriodSinceDate(new Date('2022-06-24 9:50:00'))).toEqual(
      'a week ago',
    );
    expect(getPeriodSinceDate(new Date('2022-06-15 9:50:00'))).toEqual(
      '2 weeks ago',
    );
    expect(getPeriodSinceDate(new Date('2022-06-01 9:50:00'))).toEqual(
      'a month ago',
    );
    expect(getPeriodSinceDate(new Date('2022-05-01 9:50:00'))).toEqual(
      '2 months ago',
    );
    expect(getPeriodSinceDate(new Date('2021-06-01 9:50:00'))).toEqual(
      'a year ago',
    );
    expect(getPeriodSinceDate(new Date('2020-05-01 9:50:00'))).toEqual(
      '2 years ago',
    );
  });
});
