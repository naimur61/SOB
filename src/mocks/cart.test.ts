import { expect, test, vi } from "vitest";
import type { Config } from "../types/menu";
import { availableStock, RESERVATION_MS, reserveItem } from "./cart";
import { readDb } from "./db";

const A: Config = { toast: 1, scrambled: 2, sausage: 1, ketchup: 1 };

test("the same idempotency key creates one item", () => {
  reserveItem({ config: A, quantity: 1 }, "key-1");
  reserveItem({ config: A, quantity: 1 }, "key-1");

  expect(readDb().items).toHaveLength(1);
  expect(availableStock(readDb().items).egg).toBe(8);
});

test("a short item reserves nothing at all", () => {
  // sausage is enough for this item, eggs are not
  reserveItem({ config: { ...A, scrambled: 6 }, quantity: 1 }, "key-1");
  const result = reserveItem({ config: { ...A, scrambled: 6 }, quantity: 1 }, "key-2");

  expect(result).toEqual({ status: 409, message: "Short: 2 egg" });
  expect(availableStock(readDb().items)).toMatchObject({ egg: 4, sausage: 3, toast: 19 });
});

test("an invalid configuration is refused by the server too", () => {
  const result = reserveItem({ config: { ...A, scrambled: 3 }, quantity: 1 }, "key-1");

  expect(result).toMatchObject({ status: 422 });
  expect(readDb().items).toHaveLength(0);
});

test("stock comes back after 5 minutes of server time", () => {
  vi.useFakeTimers();
  reserveItem({ config: A, quantity: 1 }, "key-1");

  vi.advanceTimersByTime(RESERVATION_MS - 1);
  expect(availableStock(readDb().items).egg).toBe(8);

  vi.advanceTimersByTime(1);
  expect(availableStock(readDb().items).egg).toBe(10);
  expect(readDb().items).toHaveLength(1); // the item stays in the cart, expired

  vi.useRealTimers();
});
