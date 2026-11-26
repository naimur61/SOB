import DownloadButton from "../components/orders/DownloadButton";
import OrderList from "../components/orders/OrderList";
import { useOrders } from "../hooks/useOrders";

function OrdersPage() {
  const { orders, error } = useOrders();

  if (error) return <p role="alert">{error}</p>;
  if (!orders) return <p>Loading orders...</p>;

  return (
    <>
      <DownloadButton orders={orders} />
      <OrderList orders={orders} />
    </>
  );
}

export default OrdersPage;
