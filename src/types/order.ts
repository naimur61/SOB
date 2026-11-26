import type { Config } from "./menu";
import type { CouponStatus, Price } from "./price";

// A stored order. All money is integer poisha.
export type Order = {
  id: string;
  createdAt: string; // Asia/Dhaka, e.g. 2026-11-20T09:15:00.000+06:00
  paymentMethod: string;
  coupon: { code: string; status: CouponStatus } | null; // null = no code entered
  lines: {
    qty: number;
    options: Config;
    unitSubtotal: number;
    extrasDiscount: number;
    comboDiscount: number;
    unitPrice: number;
    total: number;
  }[];
  totals: Pick<Price, "subtotal" | "discount" | "vat" | "payable">;
};
