import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { expect, test } from "vitest";
import QuantityPicker, { type QuantityForm } from "./QuantityPicker";

// A small page around the picker, like BuilderPage
function Page() {
  const form = useForm<QuantityForm>({ defaultValues: { quantity: 4 } });
  const quantity = useWatch({ control: form.control, name: "quantity" });

  return (
    <FormProvider {...form}>
      <QuantityPicker max={5} />
      <p>Picked {quantity}</p>
      <button type="button" onClick={() => form.setValue("quantity", 1)}>
        Reset
      </button>
    </FormProvider>
  );
}

test("the picked quantity is a number in the form", () => {
  render(<Page />);

  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "3" } });

  expect(screen.getByText("Picked 3")).toBeInTheDocument();
});

test("the field shows the new value when the page resets the quantity", () => {
  render(<Page />);
  expect(screen.getByLabelText("Quantity")).toHaveValue("4");

  fireEvent.click(screen.getByRole("button", { name: "Reset" }));

  expect(screen.getByLabelText("Quantity")).toHaveValue("1");
  expect(screen.getByText("Picked 1")).toBeInTheDocument();
});
