import type { Order } from "../types/order";

// Pure functions over the stored orders. All money is integer poisha.
// "Revenue" means what customers paid (after discounts, with VAT).

export function countOrders(orders: Order[]) {
  return orders.length;
}

export function totalRevenue(orders: Order[]) {
  return orders.reduce((sum, order) => sum + order.totals.payable, 0);
}

export function averageOrderValue(orders: Order[]) {
  if (orders.length === 0) return 0;
  return Math.round(totalRevenue(orders) / orders.length);
}

// Units = line quantity x option quantity
export function bestSellingOption(orders: Order[]) {
  const units: Record<string, number> = {};

  for (const line of orders.flatMap((order) => order.lines)) {
    for (const [optionId, qty] of Object.entries(line.options)) {
      units[optionId] = (units[optionId] ?? 0) + qty * line.qty;
    }
  }

  const most = Math.max(0, ...Object.values(units));
  const optionIds = Object.keys(units).filter((id) => most > 0 && units[id] === most);

  return { optionIds, units: most };
}

export function revenueByPaymentMethod(orders: Order[]) {
  const revenue: Record<string, number> = {};

  for (const order of orders) {
    const method = order.paymentMethod;
    revenue[method] = (revenue[method] ?? 0) + order.totals.payable;
  }

  return revenue;
}

export function couponUsage(orders: Order[]) {
  const entered = orders.flatMap((order) =>
    order.coupon ? [{ id: order.id, ...order.coupon }] : [],
  );
  const notApplied = entered.filter((coupon) => coupon.status !== "applied");

  return {
    entered: entered.length,
    applied: entered.length - notApplied.length,
    notApplied,
  };
}

// "2026-11-20" as the shop sees it
function dhakaDate(time: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date(time));
}

export function ordersOnDate(orders: Order[], date: string) {
  const found = orders.filter((order) => dhakaDate(order.createdAt) === date);

  return {
    count: found.length,
    revenue: totalRevenue(found),
    orderIds: found.map((order) => order.id),
  };
}
