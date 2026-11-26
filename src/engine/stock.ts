import type { Config, Group, Option } from "../types/menu";

// ingredient -> amount
export type Stock = Record<string, number>;

export type Shortage = {
  ingredient: string;
  missing: number;
};

export function addStock(a: Stock, b: Stock): Stock {
  const result = { ...a };
  for (const [ingredient, amount] of Object.entries(b)) {
    result[ingredient] = (result[ingredient] ?? 0) + amount;
  }
  return result;
}

export function subtractStock(a: Stock, b: Stock): Stock {
  const result = { ...a };
  for (const [ingredient, amount] of Object.entries(b)) {
    result[ingredient] = (result[ingredient] ?? 0) - amount;
  }
  return result;
}

// What one cart item needs in total (its options times its quantity)
export function ingredientUsage(config: Config, quantity: number, groups: Group[]): Stock {
  let usage: Stock = {};

  for (const option of groups.flatMap((g) => g.options)) {
    const units = (config[option.id] ?? 0) * quantity;
    if (units === 0) continue;

    for (const [ingredient, amount] of Object.entries(option.uses)) {
      usage = addStock(usage, { [ingredient]: amount * units });
    }
  }

  return usage;
}

export function findShortages(need: Stock, available: Stock): Shortage[] {
  return Object.entries(need)
    .map(([ingredient, amount]) => ({ ingredient, missing: amount - (available[ingredient] ?? 0) }))
    .filter((shortage) => shortage.missing > 0);
}

export function shortageMessage(shortages: Shortage[]) {
  if (shortages.length === 0) return "";

  return "Short: " + shortages.map((s) => `${s.missing} ${s.ingredient}`).join(", ");
}

// How many more units of an option fit right now. canAdd null means no limit.
// "need" is what the item being built already uses.
export function optionStock(option: Option, need: Stock, quantity: number, available: Stock) {
  const uses = Object.entries(option.uses);
  if (uses.length === 0) return { canAdd: null, reason: "" };

  const fits = uses.map(([ingredient, amount]) => {
    const free = (available[ingredient] ?? 0) - (need[ingredient] ?? 0);
    return Math.floor(free / (amount * quantity));
  });
  const canAdd = Math.max(0, Math.min(...fits));
  if (canAdd > 0) return { canAdd, reason: "" };

  // Blocked: say what one more unit would be missing
  const oneMore = uses.map(([ingredient, amount]) => ({
    ingredient,
    missing: (need[ingredient] ?? 0) + amount * quantity - (available[ingredient] ?? 0),
  }));

  return { canAdd, reason: shortageMessage(oneMore.filter((s) => s.missing > 0)) };
}
