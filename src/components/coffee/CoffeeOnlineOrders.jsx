import { useEffect, useState } from 'react';
import { useGymData } from '../../context/GymDataContext';

const ORDER_STATUSES = ['New', 'Contacted', 'Completed', 'Cancelled'];

const fmtMoney = (n) => `৳${Math.round(Number(n) || 0).toLocaleString()}`;

// Order requests placed on the public coffee shop site (shop_orders table).
export default function CoffeeOnlineOrders() {
  const { fetchShopOrders, updateShopOrderStatus } = useGymData();
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    const loadOrders = async () => {
      try {
        const result = await fetchShopOrders();
        if (isCurrent) {
          setOrders(result);
          setOrdersError('');
        }
      } catch (error) {
        if (isCurrent) setOrdersError(error.message || 'Could not load online orders.');
      }
    };
    loadOrders();
    const timer = window.setInterval(loadOrders, 30_000);
    return () => {
      isCurrent = false;
      window.clearInterval(timer);
    };
  }, [fetchShopOrders]);

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      const updated = await updateShopOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => order.id === orderId ? updated : order));
      setOrdersError('');
    } catch (error) {
      setOrdersError(error.message || 'Could not update order status.');
    }
  };

  return (
    <div className="activity-card">
      <div className="activity-header">
        <span style={{ fontWeight: 800 }}>Online Order Requests</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {orders.length} requests · refreshes every 30 seconds
        </span>
      </div>
      {ordersError && (
        <div role="alert" style={{ margin: '16px', color: 'var(--danger)', fontSize: '13px' }}>
          {ordersError}
        </div>
      )}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Delivery Address</th>
              <th>Requested</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  {ordersError ? 'Orders could not be loaded.' : 'No online orders yet.'}
                </td>
              </tr>
            ) : orders.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700 }}>#{order.id}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{order.phone}</div>
                  {order.email && <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{order.email}</div>}
                </td>
                <td>
                  {(order.items || []).map((item) => (
                    <div key={`${order.id}-${item.productId}`}>
                      {item.name} × {item.quantity}{item.size ? ` · ${item.size}` : ''}
                    </div>
                  ))}
                  {order.customer_note && (
                    <div style={{ marginTop: '5px', color: 'var(--text-muted)', fontSize: '11px' }}>
                      Note: {order.customer_note}
                    </div>
                  )}
                </td>
                <td style={{ fontWeight: 700 }}>{fmtMoney(order.total)}</td>
                <td>{order.delivery_address}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <select
                    className="form-select"
                    value={order.status}
                    aria-label={`Status for order ${order.id}`}
                    onChange={(event) => handleOrderStatusChange(order.id, event.target.value)}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
