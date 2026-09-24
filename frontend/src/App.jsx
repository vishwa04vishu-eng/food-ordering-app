// App.jsx
// --------
// Defines the app's routes: which page component renders for each URL.
// react-router-dom's <Routes>/<Route> is the standard way to do this.
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import MyOrders from './pages/MyOrders'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/cart" element={
          <ProtectedRoute><Cart /></ProtectedRoute>
        } />

        <Route path="/my-orders" element={
          <ProtectedRoute><MyOrders /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />
      </Routes>
    </>
  )
}
