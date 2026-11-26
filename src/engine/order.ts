import type { Menu } from "../types/menu";
import type { Order } from "../types/order";
import type { Cart } from "../types/price";
import { priceCart } from "./pricing";

type OrderInfo = Pick<Order, "id" | "createdAt" | "paymentMethod">;

// Prices a cart at the order time and returns the order as it is stored
export function buildOrder(info: OrderInfo, cart: Cart, menu: Menu): Order {
  const price = priceCart(cart, menu, menu.promotions, info.createdAt);
  const code = cart.couponCode?.trim().toUpperCase();

  return {
    ...info,
    coupon: code ? { code, status: price.couponStatus } : null,
    lines: price.lines.map(({ quantity, ...amounts }, index) => ({
      qty: quantity,
      options: cart.lines[index].config,
      ...amounts,
    })),
    totals: {
      subtotal: price.subtotal,
      discount: price.discount,
      vat: price.vat,
      payable: price.payable,
    },
  };
}
