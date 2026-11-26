import {
  averageOrderValue,
  bestSellingOption,
  countOrders,
  couponUsage,
  ordersOnDate,
  revenueByPaymentMethod,
  totalRevenue,
} from "../../engine/stats";
import type { Menu } from "../../types/menu";
import type { Order } from "../../types/order";
import { formatTaka } from "../../utils/money";

// What the model is allowed to ask for
export const toolDeclarations = [
  { name: "countOrders", description: "How many orders there are in total." },
  { name: "totalRevenue", description: "Total money paid by customers across all orders." },
  { name: "averageOrderValue", description: "Average amount paid per order." },
  { name: "bestSellingOption", description: "The menu option(s) sold in the most units." },
  { name: "revenueByPaymentMethod", description: "Money paid, split by payment method." },
  {
    name: "couponUsage",
    description: "How many orders entered a coupon, how many really got it, and why others did not.",
  },
  {
    name: "ordersOnDate",
    description: "Number of orders, revenue and order ids on one date.",
    parameters: {
      type: "object",
      properties: { date: { type: "string", description: "Date as YYYY-MM-DD" } },
      required: ["date"],
    },
  },
];

// Runs one tool. Money is turned into text here, so the model never does maths.
export function runTool(
  name: string,
  args: Record<string, unknown>,
  orders: Order[],
  menu: Menu,
): Record<string, unknown> {
  switch (name) {
    case "countOrders":
      return { orders: countOrders(orders) };

    case "totalRevenue":
      return { revenue: formatTaka(totalRevenue(orders)) };

    case "averageOrderValue":
      return { average: formatTaka(averageOrderValue(orders)), orders: countOrders(orders) };

    case "bestSellingOption": {
      const { optionIds, units } = bestSellingOption(orders);
      const options = menu.groups.flatMap((group) => group.options);
      const names = optionIds.map((id) => options.find((o) => o.id === id)?.name ?? id);
      return { options: names, units };
    }

    case "revenueByPaymentMethod":
      return Object.fromEntries(
        Object.entries(revenueByPaymentMethod(orders)).map(([method, amount]) => [
          method,
          formatTaka(amount),
        ]),
      );

    case "couponUsage":
      return couponUsage(orders);

    case "ordersOnDate": {
      const date = String(args.date);
      const result = ordersOnDate(orders, date);
      return { date, ...result, revenue: formatTaka(result.revenue) };
    }

    default:
      return { error: "Unknown function" };
  }
}
