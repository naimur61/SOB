import { renderHook, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { SERVER_AHEAD_MS } from "../mocks/clock";
import { useServerClock } from "./useServerClock";

test("clock follows the server, not the browser", async () => {
  const { result } = renderHook(() => useServerClock());

  await waitFor(() => expect(result.current).not.toBeNull());

  const ahead = result.current! - Date.now();
  expect(Math.abs(ahead - SERVER_AHEAD_MS)).toBeLessThan(1000);
});
