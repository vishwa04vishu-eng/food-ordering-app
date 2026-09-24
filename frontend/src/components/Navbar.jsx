import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🍔 FoodApp</Link>
      <div>
        <Link to="/">Menu</Link>
        {user && <Link to="/cart">Cart</Link>}
        {user && <Link to="/my-orders">My Orders</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}

        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <span style={{ marginLeft: 16 }}>
            Hi, {user.name}{' '}
            <button className="btn secondary" onClick={handleLogout} style={{ marginLeft: 8 }}>
              Logout
            </button>
          </span>
        )}
      </div>
    </nav>
  )
}
