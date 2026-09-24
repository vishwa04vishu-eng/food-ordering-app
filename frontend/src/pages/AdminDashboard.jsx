// AdminDashboard.jsx
// --------------------
// One page with three tabs: Food Items (CRUD), Orders (view + update status),
// Customers (read-only list). Kept as a single file for simplicity since it's
// an intern project - in a bigger app you'd split each tab into its own file.
import { useEffect, useState } from 'react'
import api from '../api'

const EMPTY_FORM = { id: null, name: '', description: '', category: '', price: '', image_url: '', is_available: true }
const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']

export default function AdminDashboard() {
  const [tab, setTab] = useState('food')

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <div style={{ marginBottom: 20 }}>
        {['food', 'orders', 'customers'].map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? '' : 'secondary'}`}
            style={{ marginRight: 8, textTransform: 'capitalize' }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'food' && <FoodManager />}
      {tab === 'orders' && <OrdersManager />}
      {tab === 'customers' && <CustomersList />}
    </div>
  )
}

// ---------------- Food Items Tab ----------------
function FoodManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  function load() {
    api.get('/food').then((res) => setItems(res.data))
  }
  useEffect(load, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function editItem(item) {
    setForm({ ...item, price: String(item.price) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price),
      image_url: form.image_url,
      is_available: form.is_available,
    }
    try {
      if (form.id) {
        await api.put(`/food/${form.id}`, payload)
      } else {
        await api.post('/food', payload)
      }
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save item.')
    }
  }

  async function deleteItem(id) {
    if (!confirm('Delete this food item?')) return
    await api.delete(`/food/${id}`)
    load()
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>{form.id ? 'Edit Food Item' : 'Add Food Item'}</h3>
        <form onSubmit={handleSubmit}>
          <input className="input" placeholder="Name" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          <input className="input" placeholder="Description" value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
          <input className="input" placeholder="Category" required value={form.category} onChange={(e) => update('category', e.target.value)} />
          <input className="input" placeholder="Price" type="number" step="0.01" required value={form.price} onChange={(e) => update('price', e.target.value)} />
          <input className="input" placeholder="Image URL (optional)" value={form.image_url || ''} onChange={(e) => update('image_url', e.target.value)} />
          <label>
            <input type="checkbox" checked={form.is_available} onChange={(e) => update('is_available', e.target.checked)} /> Available
          </label>
          {error && <div className="error">{error}</div>}
          <div style={{ marginTop: 10 }}>
            <button className="btn" type="submit">{form.id ? 'Update' : 'Add'} Item</button>
            {form.id && <button className="btn secondary" type="button" style={{ marginLeft: 8 }} onClick={() => setForm(EMPTY_FORM)}>Cancel</button>}
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>₹{item.price}</td>
              <td>{item.is_available ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn secondary" onClick={() => editItem(item)}>Edit</button>{' '}
                <button className="btn danger" onClick={() => deleteItem(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------- Orders Tab ----------------
function OrdersManager() {
  const [orders, setOrders] = useState([])

  function load() {
    api.get('/admin/orders').then((res) => setOrders(res.data))
  }
  useEffect(load, [])

  async function changeStatus(orderId, status) {
    await api.put(`/admin/orders/${orderId}/status`, { status })
    load()
  }

  return (
    <table>
      <thead>
        <tr><th>Order #</th><th>Customer ID</th><th>Total</th><th>Status</th><th>Placed</th></tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.user_id}</td>
            <td>₹{order.total_amount}</td>
            <td>
              <select className="input" style={{ margin: 0 }} value={order.status}
                onChange={(e) => changeStatus(order.id, e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </td>
            <td>{new Date(order.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------- Customers Tab ----------------
function CustomersList() {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    api.get('/admin/customers').then((res) => setCustomers(res.data))
  }, [])

  return (
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th><th>Joined</th></tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.email}</td>
            <td>{new Date(c.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
