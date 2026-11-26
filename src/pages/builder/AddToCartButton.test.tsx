import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { render } from "../../test/render";
import { availableStock } from "../../mocks/backend/cart";
import { readDb } from "../../mocks/backend/db";
import AddToCartButton from "./AddToCartButton";

const line = { config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 };

test("TC-13: three quick clicks create one item and one reservation", async () => {
  const onAdded = vi.fn();
  render(<AddToCartButton line={line} disabled={false} onAdded={onAdded} onFailed={() => {}} />);

  const button = screen.getByRole("button");
  fireEvent.click(button);
  fireEvent.click(button);
  fireEvent.click(button);

  await waitFor(() => expect(onAdded).toHaveBeenCalled());
  expect(onAdded).toHaveBeenCalledTimes(1);
  expect(readDb().items).toHaveLength(1);
  expect(availableStock(readDb().items).egg).toBe(8);
});

test("TC-14: a failed save holds no stock, and Retry works", async () => {
  const onAdded = vi.fn();
  render(<AddToCartButton line={line} disabled={false} onAdded={onAdded} onFailed={() => {}} />);

  // the server breaks while saving
  const save = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
    throw new Error("disk full");
  });
  fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

  const retry = await screen.findByRole("button", { name: "Retry" });
  expect(availableStock(readDb().items).egg).toBe(10);

  fireEvent.click(retry);
  await waitFor(() => expect(onAdded).toHaveBeenCalled());
  expect(readDb().items).toHaveLength(1);
  save.mockRestore();
});
