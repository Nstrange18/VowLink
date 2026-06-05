import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  if (adminOnly) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute
