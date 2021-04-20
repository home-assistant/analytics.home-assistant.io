import { average } from "../../src/utils/average";

it("test", function () {
  expect(average([0, 0, 3])).toBe(1);
  expect(average([1, 2, 3])).toBe(2);
  expect(average([3, 3, 3])).toBe(3);
  expect(average([3])).toBe(3);
});
