import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createElement } from "react";
import { expect, test, vi } from "vitest";
import { render, renderHook } from "../test/render";
import { RESERVATION_MS, reserveItem } from "../mocks/backend/cart";
import { SERVER_AHEAD_MS } from "../mocks/backend/clock";
import { server } from "../mocks/server";
import CartPage from "../pages/cart/CartPage";
import { useServerClock } from "./useServerClock";

test("TC-15 clock follows the server, not the browser", async () => {
  const { result } = renderHook(() => useServerClock());

  await waitFor(() => expect(result.current).not.toBeNull());

  const ahead = result.current! - Date.now();
  expect(Math.abs(ahead - SERVER_AHEAD_MS)).toBeLessThan(1000);
});

test("a failed time request is retried until the server answers", async () => {
  server.use(http.get("/api/time", () => HttpResponse.error(), { once: true }));

  const { result } = renderHook(() => useServerClock());

  await waitFor(() => expect(result.current).not.toBeNull(), { timeout: 3000 });
  const ahead = result.current! - Date.now();
  expect(Math.abs(ahead - SERVER_AHEAD_MS)).toBeLessThan(1000);
});

function Cart() {
  return createElement(CartPage, {
    serverNow: useServerClock(),
    couponCode: "",
    onCouponChange: () => {},
    onEdit: () => {},
  });
}

test("TC-15 countdown follows server time, not the browser", async () => {
  reserveItem({ config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 }, "item");
  render(createElement(Cart));

  // measured with the browser clock it would show about 6:30
  expect(await screen.findByText(/Reserved for (5:00|4:5\d)/)).toBeInTheDocument();

  vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + RESERVATION_MS });

  expect(
    await screen.findByText(/Reservation expired/, {}, { timeout: 2500 }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
  vi.useRealTimers();
});
