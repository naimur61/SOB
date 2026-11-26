import { expect, test } from "vitest";
import menuJson from "../mocks/data/menu.json";
import type { Config, Group, Menu } from "../types/menu";
import { validate } from "./rules";

const menu = menuJson as Menu;
const check = (config: Config) => validate(config, menu.groups, menu.rules);

const valid: Config = { toast: 1, scrambled: 2, sausage: 1, ketchup: 1 };

test("a valid configuration has no violations", () => {
  expect(check(valid)).toEqual([]);
});

test("mixed eggs that add up to the step are valid", () => {
  expect(check({ toast: 1, scrambled: 1, fried: 1, sausage: 1 })).toEqual([]);
});

test("an empty configuration lists every group that has a minimum", () => {
  expect(check({}).map((v) => v.id)).toEqual(["bread", "eggs", "protein"]);
});

test("TC-01: scrambled x3 breaks the egg step", () => {
  expect(check({ ...valid, scrambled: 3 })).toEqual([
    { id: "eggs", message: "Eggs: total must be 2-6 in steps of 2" },
  ]);
});

test("TC-02: croissant lowers the extras max to 2", () => {
  const config = { croissant: 1, scrambled: 2, sausage: 1, hashbrown: 1, mushroom: 1, beans: 1 };

  expect(check(config)).toEqual([
    { id: "R3", message: "Extras: max is 2 when Croissant is selected" },
  ]);
});

test("without croissant the base extras max still applies", () => {
  expect(check({ ...valid, hashbrown: 5 })).toEqual([
    { id: "extras", message: "Extras: choose at most 4" },
  ]);
});

test("TC-03: hollandaise needs scrambled or omelette", () => {
  expect(check({ toast: 1, fried: 2, sausage: 1, hollandaise: 1 })).toEqual([
    { id: "R1", message: "Hollandaise requires Scrambled or Omelette" },
  ]);
});

test("TC-04: both excludes violations are listed", () => {
  const config = { toast: 1, scrambled: 2, tofu: 1, bacon: 1, chili: 1, hollandaise: 1 };

  expect(check(config)).toEqual([
    { id: "R2", message: "Tofu cannot be combined with Beef Bacon" },
    { id: "R4", message: "Chili cannot be combined with Hollandaise" },
  ]);
});

test("maxDistinct and maxPerOption", () => {
  const config = { ...valid, ketchup: 2, chili: 1, hollandaise: 1 };

  expect(check(config).map((v) => v.message)).toEqual([
    "Sauce: choose at most 2 different options",
    "Sauce: Ketchup can be added at most 1 time(s)",
    "Chili cannot be combined with Hollandaise",
  ]);
});

test("works with a different menu", () => {
  const groups: Group[] = [
    {
      id: "size",
      name: "Size",
      min: 1,
      max: 1,
      options: [{ id: "big", name: "Big", price: 0, uses: {} }],
    },
  ];

  expect(validate({}, groups, [])).toEqual([{ id: "size", message: "Size: choose at least 1" }]);
});
