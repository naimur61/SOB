export async function getServerTime(): Promise<string> {
  const res = await fetch("/api/time");
  if (!res.ok) throw new Error("Could not read server time");
  const data = await res.json();
  return data.serverTime;
}
