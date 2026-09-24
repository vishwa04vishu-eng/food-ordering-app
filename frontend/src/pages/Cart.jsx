import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)
  const navigate = useNavigate()

  function loadCart() {
    api.get('/cart').then((res) => setCart(res.data))
  }

  useEffect(loadCart, [])

  async function updateQuantity(cartItemId, quantity) {
    if (quantity < 1) return
    const res = await api.put(`/cart/items/${cartItemId}`, { quantity })
    setCart(res.data)
  }

  async function removeItem(cartItemId) {
    const res = await api.delete(`/cart/items/${cartItemId}`)
    setCart(res.data)
  }

  async function placeOrder() {
    setError('')
    setPlacing(true)
    try {
      await api.post('/orders')
      navigate('/my-orders')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not place order.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="container">
      <h2>Your Cart</h2>

      {cart.items.length === 0 && <p>Your cart is empty. Go add something tasty!</p>}

      {cart.items.map((line) => (
        <div className="card" key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <strong>{line.food_item.name}</strong>
            <div style={{ color: '#777', fontSize: '0.85rem' }}>₹{line.food_item.price} each</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn secondary" onClick={() => updateQuantity(line.id, line.quantity - 1)}>-</button>
            <span>{line.quantity}</span>
            <button className="btn secondary" onClick={() => updateQuantity(line.id, line.quantity + 1)}>+</button>
            <span style={{ minWidth: 70, textAlign: 'right' }}>₹{line.subtotal}</span>
            <button className="btn danger" onClick={() => removeItem(line.id)}>Remove</button>
          </div>
        </div>
      ))}

      {cart.items.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>Total: ₹{cart.total}</h3>
          {error && <div className="error">{error}</div>}
          <button className="btn" onClick={placeOrder} disabled={placing}>
            {placing ? 'Placing order...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  )
}
