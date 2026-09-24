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
  const { user } = useAuth()

  // Runs once on mount to populate the category dropdown
  useEffect(() => {
    api.get('/food/categories/list').then((res) => setCategories(res.data)).catch(() => {})
  }, [])

  // Runs whenever `search` or `category` changes -> re-fetches the filtered list.
  // This is a debounce-free simple version; fine for an intern-level project.
  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (category !== 'all') params.category = category

    api.get('/food', { params }).then((res) => setItems(res.data))
  }, [search, category])

  async function addToCart(foodItemId) {
    setMessage('')
    try {
      await api.post('/cart/items', { food_item_id: foodItemId, quantity: 1 })
      setMessage('Added to cart!')
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
        {items.map((item) => (
          <div className="card" key={item.id}>
            <h3>{item.name}</h3>
            <p style={{ color: '#777', fontSize: '0.9rem' }}>{item.description}</p>
            <p><span className="badge">{item.category}</span></p>
            <p style={{ fontWeight: 700 }}>₹{item.price}</p>
            {user?.role !== 'admin' && (
              <button className="btn" onClick={() => addToCart(item.id)}>Add to Cart</button>
            )}
          </div>
        ))}
        {items.length === 0 && <p>No items found.</p>}
      </div>
    </div>
  )
}
