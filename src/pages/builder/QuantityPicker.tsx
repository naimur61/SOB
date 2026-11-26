type Props = {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
};

function QuantityPicker({ quantity, max, onChange }: Props) {
  const choices = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <label className="quantity">
      Quantity
      <select value={quantity} onChange={(e) => onChange(Number(e.target.value))}>
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
