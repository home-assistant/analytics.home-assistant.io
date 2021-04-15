export const formatDate = (date: Date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
  };
};
