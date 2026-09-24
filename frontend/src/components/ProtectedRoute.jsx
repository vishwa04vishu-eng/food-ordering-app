// ProtectedRoute.jsx
// --------------------
// Wraps a page and redirects to /login if nobody is logged in, or to
// the home page if the user is logged in but doesn't have the right role
// (e.g. a customer trying to open /admin). This is how "role-based access"
// is enforced on the frontend (the backend enforces it too - see auth.py's
// require_admin - the frontend check is just for a good user experience).
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />

  return children
}
