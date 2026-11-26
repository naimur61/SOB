import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { render } from "../../test/render";
import { reserveItem } from "../../mocks/backend/cart";
import { readDb } from "../../mocks/backend/db";
import { server } from "../../mocks/server";
import PayButton from "./PayButton";

test("TC-16: clicking Pay twice creates exactly one order", async () => {
  reserveItem(
    { config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 },
    "item",
  );
  const onPaid = vi.fn();
  render(
    <PayButton
      methods={["card"]}
      couponCode=""
      itemIds={["item"]}
      onPaid={onPaid}
      onFailed={() => {}}
    />,
  );

  const pay = screen.getByRole("button", { name: "Pay" });
  fireEvent.click(pay);
  fireEvent.click(pay);

  await waitFor(() => expect(onPaid).toHaveBeenCalled());
  expect(onPaid).toHaveBeenCalledTimes(1);
  expect(readDb().orders).toHaveLength(7);
  expect(readDb().items).toEqual([]);
});

test("the picked payment method is the one saved in the order", async () => {
  reserveItem(
    { config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 },
    "item",
  );
  const onPaid = vi.fn();
  render(
    <PayButton
      methods={["card", "bkash", "cash"]}
      couponCode=""
      itemIds={["item"]}
      onPaid={onPaid}
      onFailed={() => {}}
    />,
  );

  fireEvent.change(screen.getByLabelText("Payment method"), {
    target: { value: "bkash" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Pay" }));

  await waitFor(() => expect(onPaid).toHaveBeenCalled());
  expect(onPaid.mock.calls[0][0].paymentMethod).toBe("bkash");
});

test("a refused payment shows the server's reason, which clears on the next try", async () => {
  reserveItem(
    { config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 },
    "item",
  );
  server.use(
    http.post(
      "/api/checkout",
      () => HttpResponse.json({ message: "Stock changed" }, { status: 409 }),
      {
        once: true,
      },
    ),
  );
  const onPaid = vi.fn();
  const onFailed = vi.fn();
  render(
    <PayButton
      methods={["card"]}
      couponCode=""
      itemIds={["item"]}
      onPaid={onPaid}
      onFailed={onFailed}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Pay" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Not paid: Stock changed",
  );
  expect(onFailed).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Pay" }));
  await waitFor(() => expect(onPaid).toHaveBeenCalled());
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
