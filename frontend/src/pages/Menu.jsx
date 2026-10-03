// Menu.jsx
// ---------
// The main customer-facing page. Demonstrates the core React patterns:
//   - useState to hold data that changes (items, search text, category)
//   - useEffect to fetch data from the API whenever those filters change
//   - mapping an array into JSX to render a grid of cards
import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Menu() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [message, setMessage] = useState('')
  const [quantities, setQuantities] = useState({})
  const { user } = useAuth()

  useEffect(() => {
    api.get('/food/categories/list').then((res) => setCategories(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (category !== 'all') params.category = category

    api.get('/food', { params }).then((res) => setItems(res.data))
  }, [search, category])

  function adjustQuantity(itemId, change, stockLimit = 10) {
    const current = quantities[itemId] ?? 1
    if (change > 0 && current >= stockLimit) {
      setMessage("That's all of the available stock at the moment.")
      return
    }

    setQuantities((prev) => {
      const currentQuantity = prev[itemId] ?? 1
      const next = Math.max(1, Math.min(stockLimit, currentQuantity + change))
      return { ...prev, [itemId]: next }
    })
  }

  async function addToCart(foodItemId) {
    setMessage('')
    const quantity = Math.max(1, quantities[foodItemId] ?? 1)

    try {
      await api.post('/cart/items', { food_item_id: foodItemId, quantity })
      setQuantities((prev) => ({ ...prev, [foodItemId]: 1 }))
      setMessage(`Added ${quantity} item(s) to cart!`)
      setTimeout(() => setMessage(''), 1500)
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Please login to order.')
    }
  }

  return (
    <div className="container">
      <h2>Menu</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          className="input"
          style={{ margin: 0 }}
          placeholder="Search food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" style={{ margin: 0 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {message && <div className="card" style={{ marginBottom: 16 }}>{message}</div>}

      <div className="grid">
        {items.map((item) => {
          const quantity = quantities[item.id] ?? 1
          const stockLimit = Math.max(0, Number(item.stock_quantity ?? 0))
          const isOutOfStock = !item.is_available || stockLimit <= 0

          return (
            <div className="card menu-card" key={item.id}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="food-image" />
              )}

              <div className="menu-card-body">
                <h3>{item.name}</h3>
                <p style={{ color: '#777', fontSize: '0.9rem' }}>{item.description}</p>
                <p><span className="badge">{item.category}</span></p>
                <p style={{ fontWeight: 700 }}>₹{item.price}</p>
                <p style={{ color: '#666', margin: '6px 0' }}>Available: {stockLimit}</p>

                {isOutOfStock ? (
                  <div className="out-of-stock">Out of stock</div>
                ) : (
                  <div className="quantity-row">
                    <button className="qty-btn" onClick={() => adjustQuantity(item.id, -1, stockLimit)}>-</button>
                    <span>{quantity}</span>
                    <button className="qty-btn" onClick={() => adjustQuantity(item.id, 1, stockLimit)}>+</button>
                  </div>
                )}

                {user?.role !== 'admin' && (
                  <button
                    className="btn"
                    onClick={() => addToCart(item.id)}
                    disabled={isOutOfStock}
                    style={{ marginTop: 12, width: '100%' }}
                  >
                    {isOutOfStock ? 'Unavailable' : `Add ${quantity}`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {items.length === 0 && <p>No items found.</p>}
      </div>
    </div>
  )
}
