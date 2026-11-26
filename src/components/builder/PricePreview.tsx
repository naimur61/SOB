import { usePricePreview } from "../../hooks/usePricePreview";
import type { Config } from "../../types/menu";
import { formatTaka } from "../../utils/money";

type Props = {
  config: Config;
  quantity: number;
};

function PricePreview({ config, quantity }: Props) {
  const { price, loading, failed, retry } = usePricePreview(config, quantity);

  if (loading) return <p className="price muted">Updating price...</p>;

  if (failed || !price) {
    return (
      <div className="price" role="alert">
        Could not get the price. Your selection is kept.
        <button type="button" onClick={retry}>
          Retry
        </button>
      </div>
    );
  }

  const [line] = price.lines;

  return (
    <dl className="price">
      <dt>Base + options</dt>
      <dd>{formatTaka(line.unitSubtotal)}</dd>
      {line.extrasDiscount > 0 && (
        <>
          <dt>Extras deal</dt>
          <dd>−{formatTaka(line.extrasDiscount)}</dd>
        </>
      )}
      {line.comboDiscount > 0 && (
        <>
          <dt>Combo</dt>
          <dd>−{formatTaka(line.comboDiscount)}</dd>
        </>
      )}
      <dt>Unit price</dt>
      <dd>{formatTaka(line.unitPrice)}</dd>
      <dt>Item total (x{line.quantity})</dt>
      <dd>{formatTaka(line.total)}</dd>
    </dl>
  );
}

export default PricePreview;
