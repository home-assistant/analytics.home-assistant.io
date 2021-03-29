export const daysToSeconds = (days: number): number => days * 24 * 60 * 60;

export const formatDate = (date: Date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
  };
};
