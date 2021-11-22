import { median } from "../../src/utils/median";

it("test", function () {
  expect(median([0, 0, 3])).toBe(0);
  expect(median([1, 2, 3])).toBe(2);
  expect(median([3, 3, 3])).toBe(3);
  expect(median([3])).toBe(3);
  expect(median([0, 1])).toBe(0.5);
  expect(median([0, 0])).toBe(0);
  expect(median([])).toBe(0);
});
