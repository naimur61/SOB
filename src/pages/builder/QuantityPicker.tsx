import { useFormContext } from "react-hook-form";

export type QuantityForm = { quantity: number };

type Props = { max: number };

// Must be inside a FormProvider: the quantity lives in that form
function QuantityPicker({ max }: Props) {
  const { register } = useFormContext<QuantityForm>();
  const choices = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <label className="quantity">
      Quantity
      <select {...register("quantity", { valueAsNumber: true })}>
        {choices.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

export default QuantityPicker;
