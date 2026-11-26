import type { Config } from "./menu";

export type CartLine = {
  config: Config;
  quantity: number;
};

export type Cart = {
  lines: CartLine[];
  couponCode?: string | null;
};

export type PricedLine = {
  unitSubtotal: number;
  extrasDiscount: number; // per unit
  comboDiscount: number; // per unit
  unitPrice: number;
  quantity: number;
  total: number;
};

export type CouponStatus =
  | "none" // no code entered
  | "applied"
  | "unknown" // no coupon has this code
  | "expired" // entered too late in the day
  | "not-best"; // valid, but another discount is bigger or equal

export type Price = {
  lines: PricedLine[];
  subtotal: number;
  discount: { id: string; amount: number } | null;
  couponStatus: CouponStatus;
  vat: number;
  payable: number;
};
