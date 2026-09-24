import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const user = await register(form.name, form.email, form.password, form.role)
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container form-box card">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} />

        <label>Email</label>
        <input className="input" type="email" required value={form.email}
          onChange={(e) => update('email', e.target.value)} />

        <label>Password</label>
        <input className="input" type="password" required value={form.password}
          onChange={(e) => update('password', e.target.value)} />

        <label>Account Type</label>
        <select className="input" value={form.role} onChange={(e) => update('role', e.target.value)}>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>

        {error && <div className="error">{error}</div>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: 14 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
