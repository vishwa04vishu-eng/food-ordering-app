import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🍔 FoodApp</Link>
      <div>
        {!isAdminPage && <Link to="/">Menu</Link>}
        {!isAdminPage && user && <Link to="/cart">Cart</Link>}
        {!isAdminPage && user && <Link to="/my-orders">My Orders</Link>}
        {user?.role === 'admin' && !isAdminPage && <Link to="/admin">Admin</Link>}
        {user?.role === 'admin' && isAdminPage && <span>Admin Dashboard</span>}

        {!user && !isAdminPage && <Link to="/login">Login</Link>}
        {!user && !isAdminPage && <Link to="/register">Register</Link>}
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
