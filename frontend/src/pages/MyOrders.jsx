import { useEffect, useState } from 'react'
import api from '../api'

export default function MyOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/orders/my').then((res) => setOrders(res.data))
  }, [])

  return (
    <div className="container">
      <h2>My Orders</h2>
      {orders.length === 0 && <p>You haven't placed any orders yet.</p>}

      {orders.map((order) => (
        <div className="card" key={order.id} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Order #{order.id}</strong>
            <span className={`badge ${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
          </div>
          <p style={{ color: '#777', fontSize: '0.85rem' }}>
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
          <ul>
            {order.items.map((item, i) => (
              <li key={i}>{item.food_name} x {item.quantity} — ₹{item.price_at_order}</li>
            ))}
          </ul>
          <strong>Total: ₹{order.total_amount}</strong>
        </div>
      ))}
    </div>
  )
}
