import { expect, test } from "vitest";
import { request } from "../hooks/TanstackQueries/controller/fetchGetData";
import type { Menu } from "../types/menu";

test("mock api serves the menu", async () => {
  const menu = await request<Menu>("menu");

  expect(menu.product.basePrice).toBe(25000);
  expect(menu.groups.map((g) => g.id)).toEqual(["bread", "eggs", "protein", "extras", "sauce"]);
  expect(menu.rules).toHaveLength(4);
  expect(menu.stock.egg).toBe(10);
});
