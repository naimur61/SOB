// Shows a time the way the shop sees it: Asia/Dhaka, 24h.
export function formatDhakaTime(ms: number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ms);
}
