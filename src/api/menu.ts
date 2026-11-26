import type { Menu } from "../types/menu";

export async function getMenu(): Promise<Menu> {
  const res = await fetch("/api/menu");
  if (!res.ok) throw new Error("Could not load the menu");
  return res.json();
}
