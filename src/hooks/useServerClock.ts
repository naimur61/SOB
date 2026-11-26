import { useEffect, useState } from "react";
import { getServerTime } from "../api/time";

// Returns the current server time in ms, ticking every second.
// We ask the server once, remember how far ahead it is (offset),
// and add that offset to the browser clock from then on.
export function useServerClock() {
  const [offset, setOffset] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    getServerTime()
      .then((serverTime) => setOffset(new Date(serverTime).getTime() - Date.now()))
      .catch(() => setOffset(null));
  }, []);

  useEffect(() => {
    if (offset === null) return;

    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offset]);

  return now;
}
