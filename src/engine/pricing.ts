import type { Config, Menu, Promotion } from "../types/menu";
import type { Cart, CartLine, CouponStatus, Price, PricedLine } from "../types/price";

type PromoOf<T extends Promotion["type"]> = Extract<Promotion, { type: T }>;

// Everything is integer poisha. Percentages round half-up using whole numbers only.
function percentOf(amount: number, percent: number) {
  return Math.floor((amount * percent + 50) / 100);
}

// Final payable is rounded half-up to whole taka
function roundToTaka(poisha: number) {
  return Math.floor((poisha + 50) / 100) * 100;
}

function groupOptions(menu: Menu, groupId: string) {
  return menu.groups.find((g) => g.id === groupId)?.options ?? [];
}

function groupQuantity(config: Config, menu: Menu, groupId: string) {
  return groupOptions(menu, groupId).reduce((sum, o) => sum + (config[o.id] ?? 0), 0);
}

// Step 1: base price + options
function unitSubtotal(config: Config, menu: Menu) {
  return menu.groups
    .flatMap((g) => g.options)
    .reduce((sum, o) => sum + o.price * (config[o.id] ?? 0), menu.product.basePrice);
}

// Step 2: for every N units in the group, the cheapest one is free
function extrasDiscount(config: Config, menu: Menu, promo: PromoOf<"extrasDeal">) {
  const unitPrices = groupOptions(menu, promo.group)
    .flatMap((o) => Array<number>(config[o.id] ?? 0).fill(o.price))
    .sort((a, b) => a - b);

  const freeUnits = Math.floor(unitPrices.length / promo.every);
  return unitPrices.slice(0, freeUnits).reduce((sum, price) => sum + price, 0);
}

function hasCombo(config: Config, menu: Menu, promo: PromoOf<"combo">) {
  return Object.entries(promo.minQty).every(
    ([groupId, min]) => groupQuantity(config, menu, groupId) >= min,
  );
}

// Steps 1-4 for one cart line
function priceLine(line: CartLine, menu: Menu, promos: Promotion[]): PricedLine {
  const subtotal = unitSubtotal(line.config, menu);

  let extras = 0;
  for (const promo of promos) {
    if (promo.type === "extrasDeal") extras += extrasDiscount(line.config, menu, promo);
  }

  // Step 3: the combo is taken from the amount left after step 2
  let combo = 0;
  for (const promo of promos) {
    if (promo.type === "combo" && hasCombo(line.config, menu, promo)) {
      combo += percentOf(subtotal - extras, promo.percent);
    }
  }

  const unitPrice = subtotal - extras - combo;

  return {
    unitSubtotal: subtotal,
    extrasDiscount: extras,
    comboDiscount: combo,
    unitPrice,
    quantity: line.quantity,
    total: unitPrice * line.quantity,
  };
}

// "10:59" in the coupon's time zone
function clockTime(time: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(time);
}

// Step 5: only one cart discount, the larger one. On a tie the flat discount wins.
function cartDiscount(subtotal: number, code: string, promos: Promotion[], time: Date) {
  let flat: Price["discount"] = null;
  let coupon: Price["discount"] = null;
  let couponStatus: CouponStatus = code ? "unknown" : "none";

  for (const promo of promos) {
    if (promo.type === "cartFlat" && subtotal >= promo.minSubtotal) {
      if (!flat || promo.amount > flat.amount) flat = { id: promo.id, amount: promo.amount };
    }

    if (promo.type === "coupon" && promo.code === code) {
      if (clockTime(time, promo.timeZone) < promo.before) {
        const amount = Math.min(percentOf(subtotal, promo.percent), promo.cap);
        coupon = { id: promo.id, amount };
        couponStatus = "not-best";
      } else {
        couponStatus = "expired";
      }
    }
  }

  if (coupon && coupon.amount > (flat?.amount ?? 0)) {
    return { discount: coupon, couponStatus: "applied" as const };
  }
  return { discount: flat, couponStatus };
}

// Pure function: the mock server and the tests use the same one
export function priceCart(
  cart: Cart,
  menu: Menu,
  promos: Promotion[],
  serverTime: number | string,
): Price {
  const lines = cart.lines.map((line) => priceLine(line, menu, promos));
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);

  const code = cart.couponCode?.trim().toUpperCase() ?? "";
  const { discount, couponStatus } = cartDiscount(subtotal, code, promos, new Date(serverTime));

  // Step 6: VAT on the discounted subtotal
  const discounted = subtotal - (discount?.amount ?? 0);
  const vat = percentOf(discounted, menu.vatPercent);

  return {
    lines,
    subtotal,
    discount,
    couponStatus,
    vat,
    payable: roundToTaka(discounted + vat),
  };
}
