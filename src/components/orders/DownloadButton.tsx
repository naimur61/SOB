import type { Order } from "../../types/order";
import { ordersFile } from "../../utils/ordersFile";

type Props = {
  orders: Order[];
};

function DownloadButton({ orders }: Props) {
  const handleClick = () => {
    const file = new Blob([ordersFile(orders)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "orders.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <button type="button" className="primary" onClick={handleClick}>
      Download orders.json
    </button>
  );
}

export default DownloadButton;
