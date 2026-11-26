import { beforeEach, expect, test } from "vitest";
import { readDb } from "../mocks/backend/db";
import type { Order } from "../types/order";
import {
  averageOrderValue,
  bestSellingOption,
  countOrders,
  couponUsage,
  ordersOnDate,
  revenueByPaymentMethod,
  totalRevenue,
} from "./stats";

// the six seed orders, priced by our own engine
let seed: Order[];
beforeEach(() => {
  seed = readDb().orders;
});

test("each seed order is priced at its own time", () => {
  expect(seed.map((o) => o.totals.payable)).toEqual([
    33900, 71300, 127100, 57800, 86600, 122800,
  ]);
});

test("count, revenue and average", () => {
  expect(countOrders(seed)).toBe(6);
  expect(totalRevenue(seed)).toBe(499500);
  expect(averageOrderValue(seed)).toBe(83250);
});

test("best-selling option counts line quantity x option quantity", () => {
  expect(bestSellingOption(seed)).toEqual({ optionIds: ["fried"], units: 10 });
});

test("tied options are all returned", () => {
  const order = { ...seed[0], lines: [{ ...seed[0].lines[0], options: { a: 2, b: 2, c: 1 } }] };

  expect(bestSellingOption([order])).toEqual({ optionIds: ["a", "b"], units: 2 });
});

test("revenue by payment method", () => {
  expect(revenueByPaymentMethod(seed)).toEqual({ card: 214500, bkash: 157900, cash: 127100 });
});

test("coupon: who entered it and who really got it", () => {
  expect(couponUsage(seed)).toEqual({
    entered: 4,
    applied: 3,
    notApplied: [{ id: "ORD-1006", code: "MORNING15", status: "expired" }],
  });
});

test("orders on a Dhaka date", () => {
  expect(ordersOnDate(seed, "2026-11-20")).toEqual({
    count: 2,
    revenue: 105200,
    orderIds: ["ORD-1001", "ORD-1002"],
  });
  expect(ordersOnDate(seed, "2026-01-01").count).toBe(0);
});

test("a late UTC time belongs to the next Dhaka day", () => {
  const order = { ...seed[0], createdAt: "2026-11-20T20:00:00Z" };

  expect(ordersOnDate([order], "2026-11-21").count).toBe(1);
});

test("no orders", () => {
  expect(averageOrderValue([])).toBe(0);
  expect(bestSellingOption([])).toEqual({ optionIds: [], units: 0 });
});
