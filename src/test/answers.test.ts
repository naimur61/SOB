// Prints the numbers needed for ANSWERS.md:  npm run answers
import { test } from "vitest";
import { validate } from "../engine/rules";
import { priceCart } from "../engine/pricing";
import {
  bestSellingOption,
  couponUsage,
  revenueByPaymentMethod,
  totalRevenue,
} from "../engine/stats";
import { findShortages, ingredientUsage } from "../engine/stock";
import { readDb } from "../mocks/db";
import menuJson from "../mocks/data/menu.json";
import type { Config, Group, Menu } from "../types/menu";
import type { Cart } from "../types/price";
import { formatTaka } from "../utils/money";

const menu = menuJson as Menu;

const A: Config = { toast: 1, scrambled: 2, sausage: 1, ketchup: 1 };
const B: Config = {
  croissant: 1, omelette: 2, fried: 2, sausage: 1, bacon: 1,
  hashbrown: 1, mushroom: 1, hollandaise: 1,
};
const C: Config = { paratha: 1, fried: 2, tofu: 1, cheese: 2, beans: 1, mushroom: 1, chili: 1 };

const at = (time: string) => `2026-11-26T${time}:00+06:00`;

function printPrice(title: string, cart: Cart, time: string) {
  const price = priceCart(cart, menu, menu.promotions, at(time));

  console.log(
    [
      `${title}, at ${time}, coupon: ${cart.couponCode ?? "none"}`,
      ...price.lines.map(
        (l) =>
          `  line: ${formatTaka(l.unitSubtotal)} - extras ${formatTaka(l.extrasDiscount)}` +
          ` - combo ${formatTaka(l.comboDiscount)} = ${formatTaka(l.unitPrice)}` +
          ` x ${l.quantity} = ${formatTaka(l.total)}`,
      ),
      `  subtotal ${formatTaka(price.subtotal)}`,
      `  discount ${price.discount ? `${price.discount.id} ${formatTaka(price.discount.amount)}` : "none"}` +
        ` (coupon: ${price.couponStatus})`,
      `  VAT ${formatTaka(price.vat)}`,
      `  payable ${formatTaka(price.payable)}`,
    ].join("\n"),
  );
}

test("Q1: maximum number of item C from an empty cart", () => {
  const one = ingredientUsage(C, 1, menu.groups);
  let count = 0;
  while (findShortages(ingredientUsage(C, count + 1, menu.groups), menu.stock).length === 0) {
    count++;
  }

  const perIngredient = Object.entries(one).map(
    ([name, amount]) =>
      `  ${name}: ${menu.stock[name]} in stock / ${amount} per item = ${Math.floor(menu.stock[name] / amount)}`,
  );
  const next = findShortages(ingredientUsage(C, count + 1, menu.groups), menu.stock);

  console.log(
    [`Q1: max ${count} of item C`, ...perIngredient, `  one more is short: ${JSON.stringify(next)}`]
      .join("\n"),
  );
});

// Every way to pick quantities inside one group without passing its max
function picks(group: Group): Config[] {
  return group.options.reduce<Config[]>(
    (list, option) =>
      list.flatMap((config) => {
        const used = Object.values(config).reduce((a, b) => a + b, 0);
        const room = (group.max ?? 0) - used;
        return Array.from({ length: room + 1 }, (_, qty) => ({ ...config, [option.id]: qty }));
      }),
    [{}],
  );
}

test("Q2: cheapest valid configuration", () => {
  // Optional groups (min 0) only add to the price, so they are left empty
  const configs = menu.groups
    .filter((group) => group.min > 0)
    .reduce<Config[]>(
      (list, group) => list.flatMap((c) => picks(group).map((p) => ({ ...c, ...p }))),
      [{}],
    );

  const priced = configs
    .filter((config) => validate(config, menu.groups, menu.rules).length === 0)
    .map((config) => {
      const cart = { lines: [{ config, quantity: 1 }] };
      const [line] = priceCart(cart, menu, menu.promotions, at("12:00")).lines;
      return { config, unitPrice: line.unitPrice };
    });

  const lowest = Math.min(...priced.map((p) => p.unitPrice));
  const cheapest = priced
    .filter((p) => p.unitPrice === lowest)
    .map((p) => Object.entries(p.config).filter(([, qty]) => qty > 0));

  console.log(`Q2: unit price ${formatTaka(lowest)}\n  ${JSON.stringify(cheapest)}`);
});

test("Q3: cart A x3", () => {
  const lines = [{ config: A, quantity: 3 }];

  for (const time of ["10:30", "11:30"]) {
    printPrice("Q3 A x3", { lines }, time);
    printPrice("Q3 A x3", { lines, couponCode: "MORNING15" }, time);
  }
});

test("Q4: after TC-10, at 11:30", () => {
  const lines = [
    { config: { ...B, omelette: 1, fried: 3 }, quantity: 1 },
    { config: C, quantity: 2 },
  ];

  printPrice("Q4", { lines }, "11:30");
  printPrice("Q4", { lines, couponCode: "MORNING15" }, "11:30");
});

test("Q5 to Q8: seed orders", () => {
  const { orders } = readDb();
  const money = (amounts: Record<string, number>) =>
    Object.entries(amounts).map(([name, value]) => `${name} ${formatTaka(value)}`);

  console.log(
    [
      "Q5:",
      ...orders.map((o) => `  ${o.id} ${formatTaka(o.totals.payable)}`),
      `  total revenue ${formatTaka(totalRevenue(orders))}`,
      `Q6: ${JSON.stringify(bestSellingOption(orders))}`,
      `Q7: ${money(revenueByPaymentMethod(orders)).join(", ")}`,
      `Q8: ${JSON.stringify(couponUsage(orders))}`,
      ...orders
        .filter((o) => o.coupon)
        .map(
          (o) =>
            `  ${o.id} ${o.createdAt} subtotal ${formatTaka(o.totals.subtotal)}` +
            ` discount ${o.totals.discount ? `${o.totals.discount.id} ${formatTaka(o.totals.discount.amount)}` : "none"}` +
            ` coupon ${o.coupon!.status}`,
        ),
    ].join("\n"),
  );
});
