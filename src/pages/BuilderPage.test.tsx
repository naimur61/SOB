import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
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
