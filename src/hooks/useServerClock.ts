import { useEffect, useState } from "react";
import useFetchData from "./TanstackQueries/useFetchData";

const RESYNC_MS = 60_000;
const MAX_RETRY_MS = 10_000;

// Returns the current server time in ms, ticking every second.
// We ask the server, remember how far ahead it is (offset), and add that
// offset to the browser clock. It is null until the server has answered.
export function useServerClock() {
  const { data, dataUpdatedAt } = useFetchData<{ serverTime: string }>({
    queryKey: "time",
    path: "time",
    options: {
      // keep trying: after 1s, 2s, 4s, 8s, then every 10s
      retry: true,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, MAX_RETRY_MS),
      refetchInterval: RESYNC_MS,
      refetchIntervalInBackground: true,
    },
  });
  // dataUpdatedAt is the browser time at which the answer arrived
  const offset = data ? Date.parse(data.serverTime) - dataUpdatedAt : null;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (offset === null) return;

    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offset]);

  return now;
}
