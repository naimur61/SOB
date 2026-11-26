import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
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
