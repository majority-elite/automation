export const getYesterday = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - 1,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );

const formatDigit = (num: number) => `${num < 10 ? `0${num}` : num}`;

/**
 * yyyy-MM-dd
 */
export const formatDateWithoutTime = (date: Date, connector: string = '-') =>
  `${date.getFullYear()}${connector}${formatDigit(date.getMonth() + 1)}${connector}${formatDigit(date.getDate())}`;
