import { expect, test } from "vitest";
import menuJson from "../mocks/data/menu.json";
import type { Config, Menu } from "../types/menu";
import type { Cart } from "../types/price";
import { priceCart } from "./pricing";

const menu = menuJson as Menu;

const A: Config = { toast: 1, scrambled: 2, sausage: 1, ketchup: 1 };
const B: Config = {
  croissant: 1, omelette: 2, fried: 2, sausage: 1, bacon: 1,
  hashbrown: 1, mushroom: 1, hollandaise: 1,
};
const C: Config = { paratha: 1, fried: 2, tofu: 1, cheese: 2, beans: 1, mushroom: 1, chili: 1 };

const at = (time: string) => `2026-11-26T${time}+06:00`;
const price = (cart: Cart, time = at("10:00:00")) => priceCart(cart, menu, menu.promotions, time);

const bigCart: Cart = {
  lines: [
    { config: B, quantity: 1 },
    { config: C, quantity: 2 },
  ],
  couponCode: "MORNING15",
};

test("TC-05: unit prices of A, B and C", () => {
  const { lines } = price({ lines: [A, B, C].map((config) => ({ config, quantity: 1 })) });

  expect(lines.map((line) => line.unitPrice)).toEqual([38000, 67950, 49000]);
});

test("the extras deal and the combo are shown per unit", () => {
  const { lines } = price({ lines: [B, C].map((config) => ({ config, quantity: 1 })) });

  expect(lines[0]).toMatchObject({ unitSubtotal: 75500, extrasDiscount: 0, comboDiscount: 7550 });
  expect(lines[1]).toMatchObject({ unitSubtotal: 51500, extrasDiscount: 2500, comboDiscount: 0 });
});

test("TC-06: at 10:59:59 the coupon wins over the flat discount", () => {
  expect(price(bigCart, at("10:59:59"))).toMatchObject({
    subtotal: 165950,
    discount: { id: "C2", amount: 15000 },
    couponStatus: "applied",
    vat: 7548,
    payable: 158500,
  });
});

test("TC-07: at 11:00:00 the coupon is rejected", () => {
  expect(price(bigCart, at("11:00:00"))).toMatchObject({
    subtotal: 165950,
    discount: { id: "C1", amount: 10000 },
    couponStatus: "expired",
    vat: 7798,
    payable: 163700,
  });
});

test("the 11:00 cut-off is Dhaka time", () => {
  // 04:59:59 UTC is 10:59:59 in Dhaka
  expect(price(bigCart, "2026-11-26T04:59:59Z").couponStatus).toBe("applied");
  expect(price(bigCart, "2026-11-26T05:00:00Z").couponStatus).toBe("expired");
});

test("a tie goes to the flat discount", () => {
  const promos = menu.promotions.map((p) => (p.type === "coupon" ? { ...p, cap: 10000 } : p));
  const result = priceCart(bigCart, menu, promos, at("10:00:00"));

  expect(result.discount).toEqual({ id: "C1", amount: 10000 });
  expect(result.couponStatus).toBe("not-best");
});

test("no discount and unknown coupon", () => {
  const result = price({ lines: [{ config: A, quantity: 1 }], couponCode: "NOPE" });

  expect(result).toMatchObject({ discount: null, couponStatus: "unknown", vat: 1900, payable: 39900 });
});
