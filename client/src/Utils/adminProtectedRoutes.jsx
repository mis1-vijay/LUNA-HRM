import { Outlet } from 'react-router-dom'
import RoleProtectedRoute from './RoleProtectedRoute'

function ProtectedAdminRoutes() {
  return (
    <RoleProtectedRoute roles={['ADMIN']}>
      <Outlet />
    </RoleProtectedRoute>
  )
}

export default ProtectedAdminRoutes
