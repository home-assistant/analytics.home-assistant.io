export const average = (input: any[]): number => {
  const sum = input.reduce((a, b) => a + b, 0);
  return sum / input.length || 0;
};
