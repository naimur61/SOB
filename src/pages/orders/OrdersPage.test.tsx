import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { render } from "../../test/render";
import { reserveItem } from "../../mocks/backend/cart";
import { checkout } from "../../mocks/backend/checkout";
import { readDb } from "../../mocks/backend/db";
import { ordersFile } from "../../utils/ordersFile";
import OrdersPage from "./OrdersPage";

test("TC-17: a new order is still there after a reload and is exported", async () => {
  reserveItem({ config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 }, "item");
  checkout({ paymentMethod: "cash", couponCode: "" }, "pay");

  // a fresh page only has what was saved
  render(<OrdersPage />);
  expect(await screen.findByText("ORD-1007")).toBeInTheDocument();
  expect(screen.getByText("ORD-1001")).toBeInTheDocument();

  const file = JSON.parse(ordersFile(readDb().orders));
  expect(file.orders).toHaveLength(7);
  expect(file.orders[6]).toMatchObject({
    id: "ORD-1007",
    paymentMethod: "cash",
    coupon: null,
    totals: { subtotal: 38000, discount: null, vat: 1900, payable: 39900 },
  });
});
