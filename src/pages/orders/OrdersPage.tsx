import DownloadButton from "./DownloadButton";
import OrderList from "./OrderList";
import useFetchData from "../../hooks/useFetchData";
import type { Order } from "../../types/order";

function OrdersPage() {
  const { data: orders, isError } = useFetchData<Order[]>({ queryKey: "orders", path: "orders" });

  if (isError) return <p role="alert">Could not load the orders. Please reload the page.</p>;
  if (!orders) return <p>Loading orders...</p>;

  return (
    <>
      <DownloadButton orders={orders} />
      <OrderList orders={orders} />
    </>
  );
}

export default OrdersPage;
