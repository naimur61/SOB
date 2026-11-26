import { expect, test } from "vitest";
import menuJson from "../mocks/data/menu.json";
import type { Config, Menu } from "../types/menu";
import {
  addStock,
  findShortages,
  ingredientUsage,
  optionStock,
  shortageMessage,
  subtractStock,
} from "./stock";

const { groups, stock } = menuJson as Menu;

const B: Config = {
  croissant: 1, omelette: 2, fried: 2, sausage: 1, bacon: 1,
  hashbrown: 1, mushroom: 1, hollandaise: 1,
};
const C: Config = { paratha: 1, fried: 2, tofu: 1, cheese: 2, beans: 1, mushroom: 1, chili: 1 };

// cart: B x1 + C x2
const heldByB = ingredientUsage(B, 1, groups);
const heldByC = ingredientUsage(C, 2, groups);
const left = subtractStock(subtractStock(stock, heldByB), heldByC);

// An edited item may use what is left plus what it already holds
function editMessage(config: Config, quantity: number, held: Record<string, number>) {
  const need = ingredientUsage(config, quantity, groups);
  return shortageMessage(findShortages(need, addStock(left, held)));
}

test("usage is multiplied by the item quantity", () => {
  expect(ingredientUsage(C, 2, groups)).toMatchObject({ egg: 4, cheese: 4, paratha: 2 });
});

test("TC-08: remaining stock, and eggs are blocked with a reason", () => {
  expect(left).toMatchObject({ egg: 0, cheese: 0, croissant: 1 });

  const fried = groups.flatMap((g) => g.options).find((o) => o.id === "fried")!;
  expect(optionStock(fried, {}, 1, left)).toEqual({ canAdd: 0, reason: "Short: 1 egg" });
});

test("TC-09: B to omelette x3 + fried x1 is one egg short", () => {
  expect(editMessage({ ...B, omelette: 3, fried: 1 }, 1, heldByB)).toBe("Short: 1 egg");
});

test("TC-10: B to omelette x1 + fried x3 is allowed and leaves 1 egg", () => {
  const edited = { ...B, omelette: 1, fried: 3 };
  expect(editMessage(edited, 1, heldByB)).toBe("");

  const after = subtractStock(addStock(left, heldByB), ingredientUsage(edited, 1, groups));
  expect(after.egg).toBe(1);
});

test("TC-11: C quantity 3 lists every shortage", () => {
  expect(editMessage(C, 3, heldByC)).toBe("Short: 2 egg, 2 cheese");
});

test("can add counts shared ingredients and quantity", () => {
  const omelette = groups.flatMap((g) => g.options).find((o) => o.id === "omelette")!;
  const need = ingredientUsage({ fried: 2 }, 2, groups); // 4 of 10 eggs

  // 6 eggs left, one omelette in a quantity-2 item takes 4
  expect(optionStock(omelette, need, 2, stock).canAdd).toBe(1);
});

test("options without ingredients are unlimited", () => {
  const ketchup = groups.flatMap((g) => g.options).find((o) => o.id === "ketchup")!;

  expect(optionStock(ketchup, {}, 1, {}).canAdd).toBeNull();
});
