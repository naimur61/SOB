import { beforeEach, expect, test, vi } from "vitest";
import type { Config } from "../types/menu";
import { availableStock, editItem, RESERVATION_MS, reserveItem } from "./cart";
import { readDb } from "./db";

const B: Config = {
  croissant: 1, omelette: 2, fried: 2, sausage: 1, bacon: 1,
  hashbrown: 1, mushroom: 1, hollandaise: 1,
};
const C: Config = { paratha: 1, fried: 2, tofu: 1, cheese: 2, beans: 1, mushroom: 1, chili: 1 };

// the cart of TC-08: B x1 and C x2
beforeEach(() => {
  reserveItem({ config: B, quantity: 1 }, "b");
  reserveItem({ config: C, quantity: 2 }, "c");
});

const idOf = (key: string) => readDb().items.find((item) => item.idempotencyKey === key)!.id;

test("TC-09: a short edit is refused and the item keeps its allocation", () => {
  const before = readDb();
  const result = editItem(idOf("b"), { config: { ...B, omelette: 3, fried: 1 }, quantity: 1 });

  expect(result).toEqual({ status: 409, message: "Short: 1 egg" });
  expect(readDb()).toEqual(before);
});

test("TC-10: an edit swaps the allocation and leaves 1 egg", () => {
  const result = editItem(idOf("b"), { config: { ...B, omelette: 1, fried: 3 }, quantity: 1 });

  expect(result).toHaveProperty("item");
  expect(availableStock(readDb().items).egg).toBe(1);
});

test("TC-11: raising C to 3 lists both shortages", () => {
  const result = editItem(idOf("c"), { config: C, quantity: 3 });

  expect(result).toEqual({ status: 409, message: "Short: 2 egg, 2 cheese" });
});

test("TC-15 an expired item cannot be edited", () => {
  const id = idOf("b");
  vi.useFakeTimers({ now: Date.now() + RESERVATION_MS + 1000 });

  expect(editItem(id, { config: B, quantity: 1 })).toMatchObject({ status: 410 });
  vi.useRealTimers();
});
