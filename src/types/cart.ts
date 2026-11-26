import type { CartLine } from "./price";

export type CartItem = CartLine & {
  id: string;
  expiresAt: string; // server time
  idempotencyKey: string;
};
