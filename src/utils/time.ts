// 299500 -> "5:00", 61000 -> "1:01"
export function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// "20 Nov 2026, 09:15" in Asia/Dhaka
export function formatDhakaDateTime(time: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(time));
}
