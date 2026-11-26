import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { reserveItem } from "../mocks/cart";
import { readDb } from "../mocks/db";
import BuilderPage from "./BuilderPage";

const config = { toast: 1, scrambled: 2, sausage: 1 };

function addItem(key: string) {
  const result = reserveItem({ config, quantity: 1 }, key);
  if (!("item" in result)) throw new Error(result.message);
  return result.item;
}

test("D1: if the eggs are taken meanwhile, the edit is kept and the shortage shown", async () => {
  const item = addItem("tab-a");
  const onDone = vi.fn();
  render(<BuilderPage editing={item} serverNow={Date.now()} onDone={onDone} />);

  const addFried = await screen.findByRole("button", { name: "Add Fried" });
  fireEvent.click(addFried);
  fireEvent.click(addFried); // now 4 eggs

  // another tab takes the remaining 8 eggs
  reserveItem({ config: { ...config, scrambled: 6 }, quantity: 1 }, "tab-b-1");
  addItem("tab-b-2");

  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText(/Not saved: Short: 2 egg/)).toBeInTheDocument();
  expect(addFried.previousSibling).toHaveTextContent("2");
  expect(onDone).not.toHaveBeenCalled();
  expect(readDb().items[0].config).toEqual(config);
});

test("saving an edit updates the same item", async () => {
  const item = addItem("tab-a");
  const onDone = vi.fn();
  render(<BuilderPage editing={item} serverNow={Date.now()} onDone={onDone} />);

  fireEvent.change(await screen.findByLabelText("Quantity"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => expect(onDone).toHaveBeenCalled());
  expect(readDb().items).toHaveLength(1);
  expect(readDb().items[0].quantity).toBe(2);
});

test("D3: when the reservation expires the changes stay on screen", async () => {
  const item = addItem("tab-a");
  const { rerender } = render(<BuilderPage editing={item} serverNow={Date.now()} />);
  fireEvent.click(await screen.findByRole("button", { name: "Add Fried" }));

  rerender(<BuilderPage editing={item} serverNow={Date.parse(item.expiresAt)} />);

  expect(screen.getByText(/This reservation has expired/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add Fried" }).previousSibling).toHaveTextContent("1");
  expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
});
