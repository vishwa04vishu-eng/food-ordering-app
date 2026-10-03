// AdminDashboard.jsx
// --------------------
// One page with three tabs: Food Items (CRUD), Orders (view + update status),
// Customers (read-only list). Kept as a single file for simplicity since it's
// an intern project - in a bigger app you'd split each tab into its own file.
import { useEffect, useState } from 'react'
import api from '../api'

const EMPTY_FORM = { id: null, name: '', description: '', category: '', price: '', stock_quantity: '', image_url: '', is_available: true }
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
  const [catalog, setCatalog] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [addingCatalogItem, setAddingCatalogItem] = useState('')

  function load() {
    return api.get('/food').then((res) => {
      setItems(res.data)
      return res.data
    })
  }
  useEffect(() => {
    load()
    api.get('/food/catalog').then((res) => setCatalog(res.data))
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function editItem(item) {
    setForm({ ...item, price: String(item.price), stock_quantity: String(item.stock_quantity) })
    setError('')
    setIsFormOpen(true)
  }

  function startNewItem() {
    setForm(EMPTY_FORM)
    setError('')
    setIsFormOpen(true)
  }

  async function addCatalogItem(item) {
    setError('')
    setAddingCatalogItem(item.name)
    try {
      await api.post('/food', item)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add this food item.')
    } finally {
      setAddingCatalogItem('')
    }
  }

  function closeForm() {
    setForm(EMPTY_FORM)
    setError('')
    setIsFormOpen(false)
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.')
      return
    }

    setError('')
    setIsUploadingImage(true)
    const data = new FormData()
    data.append('image', file)
    try {
      const response = await api.post('/food/images', data)
      setForm((current) => ({ ...current, image_url: response.data.image_url }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not upload image.')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
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
      stock_quantity: Number(form.stock_quantity) || 0,
      is_available: form.is_available,
    }
    try {
      if (form.id) {
        await api.put(`/food/${form.id}`, payload)
      } else {
        await api.post('/food', payload)
      }
      setForm(EMPTY_FORM)
      setIsFormOpen(false)
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

  const menuItemNames = new Set(items.map((item) => item.name.toLowerCase()))
  const availableCatalogItems = catalog.filter((item) => !menuItemNames.has(item.name.toLowerCase()))

  return (
    <div>
      {!isFormOpen ? (
        <>
          <div className="admin-food-heading">
            <h3>Food Menu</h3>
            <button className="btn" type="button" onClick={startNewItem}>Choose food to add</button>
          </div>
          <div className="grid admin-food-grid">
            {items.map((item) => (
              <article className="card admin-food-card" key={item.id}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="food-image" />
                ) : (
                  <div className="admin-food-placeholder">No image</div>
                )}
                <div className="menu-card-body">
                  <p><span className="badge">{item.category}</span></p>
                  <h3>{item.name}</h3>
                  <p className="admin-food-description">{item.description || 'No description'}</p>
                  <div className="admin-food-meta">
                    <strong>₹{item.price}</strong>
                    <span>{item.stock_quantity} in stock</span>
                  </div>
                  <span className={`stock-status ${item.is_available ? 'in-stock' : 'out-stock'}`}>
                    {item.is_available ? 'In stock' : 'Out of stock'}
                  </span>
                  <div className="admin-food-actions">
                    <button className="btn secondary" type="button" onClick={() => editItem(item)}>Edit item</button>
                    <button className="btn danger" type="button" onClick={() => deleteItem(item.id)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
            {items.length === 0 && <p>No food items yet. Add your first menu item.</p>}
          </div>
        </>
      ) : form.id ? (
        <div className="card admin-food-form">
          <div className="admin-food-heading">
            <h3>{form.id ? 'Edit Food Item' : 'Add New Food'}</h3>
            <button className="btn secondary" type="button" onClick={closeForm}>Back to menu</button>
          </div>
          <form onSubmit={handleSubmit}>
            <input className="input" placeholder="Name" required value={form.name} onChange={(e) => update('name', e.target.value)} />
            <input className="input" placeholder="Description" value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
            <input className="input" placeholder="Category" required value={form.category} onChange={(e) => update('category', e.target.value)} />
            <input className="input" placeholder="Price" type="number" step="0.01" required value={form.price} onChange={(e) => update('price', e.target.value)} />
            <input
              className="input"
              placeholder="Available stock"
              type="number"
              min="0"
              step="1"
              required
              value={form.stock_quantity}
              onChange={(e) => update('stock_quantity', Number(e.target.value))}
            />

            <div className="image-upload-box">
              {form.image_url ? (
                <img src={form.image_url} alt="Food preview" className="admin-image-preview" />
              ) : (
                <div className="image-placeholder">Choose food image</div>
              )}
              <label className="btn secondary upload-btn">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} disabled={isUploadingImage} hidden />
                {isUploadingImage ? 'Uploading...' : form.image_url ? 'Change Image' : 'Choose Image'}
              </label>
            </div>

            <label>
              <input type="checkbox" checked={form.is_available} onChange={(e) => update('is_available', e.target.checked)} /> Available
            </label>
            {error && <div className="error">{error}</div>}
            <div className="admin-food-form-actions">
              <button className="btn" type="submit" disabled={isUploadingImage}>{form.id ? 'Save changes' : 'Add to menu'}</button>
              <button className="btn secondary" type="button" onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <section className="admin-catalog-picker">
          <div className="admin-food-heading">
            <div>
              <h3>Choose food to add</h3>
              <p>Select a food card to add it directly to your menu. {availableCatalogItems.length} options available.</p>
            </div>
            <button className="btn secondary" type="button" onClick={closeForm}>Back to menu</button>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="grid admin-food-grid">
            {availableCatalogItems.map((item) => {
              const isAdding = addingCatalogItem === item.name

              return (
                <article className="card admin-food-card catalog-food-card" key={item.name}>
                  <img src={item.image_url} alt={item.name} className="food-image" />
                  <div className="menu-card-body">
                    <p><span className="badge">{item.category}</span></p>
                    <h3>{item.name}</h3>
                    <p className="admin-food-description">{item.description}</p>
                    <div className="admin-food-meta">
                      <strong>₹{item.price}</strong>
                      <span>{item.stock_quantity} starting stock</span>
                    </div>
                    <button
                      className="btn catalog-add-button"
                      type="button"
                      disabled={addingCatalogItem !== ''}
                      onClick={() => addCatalogItem(item)}
                    >
                      {isAdding ? 'Adding...' : 'Add to menu'}
                    </button>
                  </div>
                </article>
              )
            })}
            {availableCatalogItems.length === 0 && (
              <p>All catalog foods are already on the menu.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// ---------------- Orders Tab ----------------
function OrdersManager() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [processingOrderId, setProcessingOrderId] = useState(null)

  function load() {
    api.get('/admin/orders').then((res) => setOrders(res.data))
  }
  useEffect(load, [])

  async function changeStatus(orderId, status) {
    await api.put(`/admin/orders/${orderId}/status`, { status })
    load()
  }

  async function decideOrder(orderId, decision) {
    setError('')
    setProcessingOrderId(orderId)
    try {
      await api.post(`/admin/orders/${orderId}/${decision}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || `Could not ${decision} this order.`)
    } finally {
      setProcessingOrderId(null)
    }
  }

  return (
    <>
      {error && <div className="error">{error}</div>}
      <table>
        <thead>
          <tr><th>Order #</th><th>Customer ID</th><th>Total</th><th>Status / Action</th><th>Placed</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.user_id}</td>
              <td>₹{order.total_amount}</td>
              <td>
                {order.status === 'pending' ? (
                  <div className="order-actions">
                    <button
                      className="btn accept"
                      type="button"
                      disabled={processingOrderId !== null}
                      onClick={() => decideOrder(order.id, 'accept')}
                    >
                      {processingOrderId === order.id ? 'Accepting...' : 'Accept order'}
                    </button>
                    <button
                      className="btn danger"
                      type="button"
                      disabled={processingOrderId !== null}
                      onClick={() => decideOrder(order.id, 'reject')}
                    >
                      {processingOrderId === order.id ? 'Rejecting...' : 'Reject order'}
                    </button>
                  </div>
                ) : (
                  <select className="input" style={{ margin: 0 }} value={order.status}
                    onChange={(e) => changeStatus(order.id, e.target.value)}>
                    {STATUS_OPTIONS.filter((status) => status !== 'pending').map((status) => (
                      <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                )}
              </td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
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
