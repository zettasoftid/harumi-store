import { Routes, Route } from 'react-router'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminProductForm from './pages/AdminProductForm'
import AdminProducts from './pages/AdminProducts'
import AdminReports from './pages/AdminReports'
import AdminSales from './pages/AdminSales'
import AdminSettings from './pages/AdminSettings'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/products/new" element={<AdminProductForm />} />
      <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
      <Route path="/admin/sales" element={<AdminSales />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </Routes>
  )
}
