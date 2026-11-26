import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { render } from "../../test/render";
import { reserveItem } from "../../mocks/cart";
import { readDb } from "../../mocks/db";
import PayButton from "./PayButton";

test("TC-16: clicking Pay twice creates exactly one order", async () => {
  reserveItem({ config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 }, "item");
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
