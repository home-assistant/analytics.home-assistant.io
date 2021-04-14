export const daysToMs = (days: number): number => 1000 * 60 * 60 * 24 * days;

export const formatDate = (date: Date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
  };
};
