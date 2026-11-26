import { expect, test } from "vitest";
import { getMenu } from "./menu";

test("mock api serves the menu", async () => {
  const menu = await getMenu();

  expect(menu.product.basePrice).toBe(25000);
  expect(menu.groups.map((g) => g.id)).toEqual(["bread", "eggs", "protein", "extras", "sauce"]);
  expect(menu.rules).toHaveLength(4);
  expect(menu.stock.egg).toBe(10);
});
