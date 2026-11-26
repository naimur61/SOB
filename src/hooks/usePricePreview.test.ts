import { act, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { renderHook } from "../test/render";
import { network } from "../mocks/network";
import { server } from "../mocks/server";
import type { Cart } from "../types/price";
import { usePricePreview } from "./usePricePreview";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("TC-12: a slow old answer never replaces the newest price", async () => {
  // quantity 1 answers slowly, quantity 2 answers at once
  server.use(
    http.post("/api/price", async ({ request }) => {
      const { quantity } = ((await request.json()) as Cart).lines[0];
      if (quantity === 1) await delay(600);
      return HttpResponse.json({ payable: quantity });
    }),
  );

  const { result, rerender } = renderHook(({ quantity }) => usePricePreview({}, quantity), {
    initialProps: { quantity: 1 },
  });

  await act(() => wait(400)); // the first request is now on its way
  rerender({ quantity: 2 });

  await waitFor(() => expect(result.current.price?.payable).toBe(2));
  await act(() => wait(600)); // the slow answer would have arrived by now
  expect(result.current.price?.payable).toBe(2);
});

test("after a failure, retry gets the price", async () => {
  network.failRate = 1;
  const { result } = renderHook(() => usePricePreview({ toast: 1 }, 1));

  await waitFor(() => expect(result.current.failed).toBe(true));

  network.failRate = 0;
  act(() => result.current.retry());

  await waitFor(() => expect(result.current.price?.lines[0].unitPrice).toBe(25000));
});
