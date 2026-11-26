import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import menuJson from "../../mocks/data/menu.json";
import type { Menu } from "../../types/menu";
import CartItemRow from "./CartItemRow";

const item = {
  id: "1",
  idempotencyKey: "k",
  config: { toast: 1, scrambled: 2 },
  quantity: 1,
  expiresAt: "2026-11-26T10:05:00Z",
};

function show(serverTime: string) {
  const row = (
    <CartItemRow
      item={item}
      menu={menuJson as Menu}
      serverNow={Date.parse(serverTime)}
      onEdit={() => {}}
      onRemove={() => {}}
    />
  );
  return render(row);
}

test("TC-15: the countdown follows server time", () => {
  show("2026-11-26T10:01:30Z");

  expect(screen.getByText("Reserved for 3:30")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
});

test("TC-15: at 5:00 the item is read-only but can be removed", () => {
  show("2026-11-26T10:05:00Z");

  expect(screen.getByText(/Reservation expired/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
});
