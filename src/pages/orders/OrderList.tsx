import type { Order } from "../../types/order";
import { formatTaka } from "../../utils/money";
import { formatDhakaDateTime } from "../../utils/time";

type Props = {
  orders: Order[];
};

function OrderList({ orders }: Props) {
  // newest first
  const sorted = [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Time (Dhaka)</th>
            <th>Payment</th>
            <th>Items</th>
            <th>Coupon</th>
            <th>Discount</th>
            <th>Payable</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{formatDhakaDateTime(order.createdAt)}</td>
              <td>{order.paymentMethod}</td>
              <td>{order.lines.reduce((sum, line) => sum + line.qty, 0)}</td>
              <td>{order.coupon ? `${order.coupon.code} (${order.coupon.status})` : "-"}</td>
              <td>{order.totals.discount ? formatTaka(order.totals.discount.amount) : "-"}</td>
              <td>{formatTaka(order.totals.payable)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderList;
