import { isDate, isNumber } from 'lodash-es';

export function timeToString(time: number) {
  const milliseconds = Math.round((time % 1000) / 10);
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
  const days = Math.floor(time / (1000 * 60 * 60 * 24));

  const result = [
    `${seconds}.${milliseconds.toString().slice(0, 2).padStart(2, '0')}s`,
  ];

  if (minutes > 0 || hours > 0 || days > 0) {
    result.push(`${minutes}m`);
  }

  if (hours > 0 || days > 0) {
    result.push(`${hours}h`);
  }

  if (days > 0) {
    result.push(`${days}d`);
  }

  return result.reverse().join(' ');
}

export function getPeriodSinceDate(date: Date): string | undefined {
  let result = undefined;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(secs / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(weeks / 4);
  const years = Math.floor(months / 12);

  if (years) {
    result = years === 1 ? `a year` : `${years} years`;
  } else if (months) {
    result = months === 1 ? `a month` : `${months} months`;
  } else if (weeks) {
    result = weeks === 1 ? `a week` : `${weeks} weeks`;
  } else if (days) {
    result = days === 1 ? `a day` : `${days} days`;
  } else if (hours) {
    result = hours === 1 ? `an hour` : `${hours} hours`;
  } else if (minutes) {
    result = minutes === 1 ? `a minute` : `${minutes} minutes`;
  } else if (secs) {
    result = secs === 1 ? `a second` : `${secs} seconds`;
  }

  return result ? `${result} ago` : result;
}

export const LocaleTimeOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export const toLocaleDateTimeString = (
  value: Date | Number | undefined,
): string => {
  if (isNumber(value)) {
    value = new Date(value);
  }

  if (isDate(value)) {
    return value.toLocaleString([], LocaleTimeOptions);
  }

  return '';
};
