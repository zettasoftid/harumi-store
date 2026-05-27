import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminProductForm from './pages/AdminProductForm'
import AdminProducts from './pages/AdminProducts'
import AdminReports from './pages/AdminReports'
import AdminSales from './pages/AdminSales'
import AdminSettings from './pages/AdminSettings'
import CatalogPage from './pages/CatalogPage'
import Home from './pages/Home'
import ProductDetailPage from './pages/ProductDetailPage'
import { trackPageView } from './lib/analytics'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<CatalogPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/products/new" element={<AdminProductForm />} />
      <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
      <Route path="/admin/sales" element={<AdminSales />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </Routes>
  )
}
