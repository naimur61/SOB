import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { RESERVATION_MS, reserveItem } from "../mocks/cart";
import { server } from "../mocks/server";
import BuilderPage from "./BuilderPage";

test("shows every group from the mock api", async () => {
  render(<BuilderPage />);

  for (const name of ["Bread", "Eggs", "Protein", "Extras", "Sauce"]) {
    expect(await screen.findByRole("heading", { name })).toBeInTheDocument();
  }
});

test("plus and minus change the quantity, minus stops at 0", async () => {
  render(<BuilderPage />);

  const add = await screen.findByRole("button", { name: "Add Fried" });
  const remove = screen.getByRole("button", { name: "Remove Fried" });
  expect(remove).toBeDisabled();

  fireEvent.click(add);
  fireEvent.click(add);
  expect(add.previousSibling).toHaveTextContent("2");

  fireEvent.click(remove);
  fireEvent.click(remove);
  expect(add.previousSibling).toHaveTextContent("0");
  expect(remove).toBeDisabled();
});

test("violations update while the user is picking", async () => {
  render(<BuilderPage />);

  const add = await screen.findByRole("button", { name: "Add Scrambled" });
  fireEvent.click(add);
  fireEvent.click(add);
  fireEvent.click(add);
  expect(screen.getByText("Eggs: total must be 2-6 in steps of 2")).toBeInTheDocument();

  fireEvent.click(add);
  expect(screen.queryByText("Eggs: total must be 2-6 in steps of 2")).not.toBeInTheDocument();
});

test("an option with no stock is disabled and says why", async () => {
  server.use(http.get("/api/stock", () => HttpResponse.json({ egg: 0 })));
  render(<BuilderPage />);

  expect(await screen.findByRole("button", { name: "Add Fried" })).toBeDisabled();
  expect(screen.getAllByText("Short: 1 egg").length).toBeGreaterThan(0);
});

test("raising the quantity shows what is short", async () => {
  render(<BuilderPage />);

  const add = await screen.findByRole("button", { name: "Add Cheese" });
  fireEvent.click(add);
  fireEvent.click(add);
  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "3" } });

  expect(screen.getByRole("alert")).toHaveTextContent("Short: 2 cheese");
});

test("add to cart is blocked until the item is valid, then holds stock", async () => {
  render(<BuilderPage />);

  const addToCart = await screen.findByRole("button", { name: "Add to Cart" });
  expect(addToCart).toBeDisabled();

  for (const name of ["Add Toast", "Add Scrambled", "Add Scrambled", "Add Chicken Sausage"]) {
    fireEvent.click(screen.getByRole("button", { name }));
  }
  fireEvent.click(addToCart);

  expect(await screen.findByRole("status")).toHaveTextContent("Added to cart");
  // 10 eggs in stock, 2 are now reserved
  expect(await screen.findByText("can add 8")).toBeInTheDocument();
});

test("stock comes back on screen when a reservation expires", async () => {
  reserveItem({ config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 }, "item");
  const { rerender } = render(<BuilderPage serverNow={Date.now()} />);
  expect(await screen.findByText("can add 19")).toBeInTheDocument(); // toast

  // five minutes pass on the server and on screen
  vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + RESERVATION_MS });
  rerender(<BuilderPage serverNow={Date.now() + RESERVATION_MS} />);

  expect(await screen.findByText("can add 20")).toBeInTheDocument(); // toast
  vi.useRealTimers();
});
