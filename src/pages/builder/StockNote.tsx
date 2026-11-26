import { shortageMessage, type Shortage } from "../../engine/stock";

type Props = {
  shortages: Shortage[];
};

function StockNote({ shortages }: Props) {
  if (shortages.length === 0) return null;

  return (
    <p className="notice" role="alert">
      {shortageMessage(shortages)}
    </p>
  );
}

export default StockNote;
