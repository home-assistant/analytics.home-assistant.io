export const daysToSeconds = (days: number): number => days * 24 * 60 * 60

export const average = (input: any[]): number => {
  const sum = input.reduce((a, b) => a + b, 0)
  return sum / input.length || 0
}

export const formatDate = (date: Date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getUTCDate(),
  }
}
