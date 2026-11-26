import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";
import { reserveItem } from "../mocks/cart";
import CartPage from "./CartPage";

const B = {
  croissant: 1, omelette: 2, fried: 2, sausage: 1, bacon: 1,
  hashbrown: 1, mushroom: 1, hollandaise: 1,
};
const C = { paratha: 1, fried: 2, tofu: 1, cheese: 2, beans: 1, mushroom: 1, chili: 1 };

function Cart({ time }: { time: string }) {
  const [coupon, setCoupon] = useState("");
  // A past date, so the new reservations are still active. Only the clock time matters.
  return (
    <CartPage
      serverNow={Date.parse(`2020-01-01T${time}+06:00`)}
      couponCode={coupon}
      onCouponChange={setCoupon}
      onEdit={() => {}}
    />
  );
}

async function showWithCoupon(time: string) {
  reserveItem({ config: B, quantity: 1 }, "b");
  reserveItem({ config: C, quantity: 2 }, "c");
  render(<Cart time={time} />);

  fireEvent.change(await screen.findByLabelText("Coupon code"), {
    target: { value: "MORNING15" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
}

test("TC-06: breakdown at 10:59:59", async () => {
  await showWithCoupon("10:59:59");

  expect(screen.getByText("1659.50 BDT")).toBeInTheDocument();
  expect(screen.getByText("−150.00 BDT")).toBeInTheDocument();
  expect(screen.getByText("75.48 BDT")).toBeInTheDocument();
  expect(screen.getByText("1585.00 BDT")).toBeInTheDocument();
});

test("TC-07: breakdown at 11:00:00", async () => {
  await showWithCoupon("11:00:00");

  expect(screen.getByRole("status")).toHaveTextContent("Coupon not applied");
  expect(screen.getByText("−100.00 BDT")).toBeInTheDocument();
  expect(screen.getByText("77.98 BDT")).toBeInTheDocument();
  expect(screen.getByText("1637.00 BDT")).toBeInTheDocument();
});
