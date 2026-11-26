import { expect, test, vi } from "vitest";
import { availableStock, RESERVATION_MS, reserveItem } from "./cart";
import { checkout } from "./checkout";
import { readDb } from "./db";

const config = { toast: 1, scrambled: 2, sausage: 1, ketchup: 1 };
const payment = { paymentMethod: "card", couponCode: "" };

test("Q5 data: the six seed orders are priced on first start", () => {
  const { orders } = readDb();

  expect(orders).toHaveLength(6);
  expect(orders.every((order) => order.totals.payable > 0)).toBe(true);
});

test("checkout creates one order and turns reserved stock into sold stock", () => {
  reserveItem({ config, quantity: 2 }, "item");
  const result = checkout(payment, "pay-1");

  expect(result).toMatchObject({ order: { id: "ORD-1007", paymentMethod: "card" } });
  expect(readDb().items).toEqual([]);

  // sold stock does not come back when the old reservation time passes
  vi.useFakeTimers({ now: Date.now() + RESERVATION_MS * 2 });
  expect(availableStock(readDb().items).egg).toBe(6);
  vi.useRealTimers();
});

test("the same idempotency key returns the same order", () => {
  reserveItem({ config, quantity: 1 }, "item");
  const first = checkout(payment, "pay-1");
  const second = checkout(payment, "pay-1");

  expect(second).toEqual(first);
  expect(readDb().orders).toHaveLength(7);
});

test("expired items cannot be paid", () => {
  reserveItem({ config, quantity: 1 }, "item");
  vi.useFakeTimers({ now: Date.now() + RESERVATION_MS * 2 });

  expect(checkout(payment, "pay-1")).toMatchObject({ status: 409 });
  expect(readDb().orders).toHaveLength(6);
  vi.useRealTimers();
});
