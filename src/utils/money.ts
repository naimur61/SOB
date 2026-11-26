// Money is kept in poisha everywhere. Convert only when showing it.
export function formatTaka(poisha: number) {
  return `${(poisha / 100).toFixed(2)} BDT`;
}
