import { Outlet } from 'react-router-dom'
import RoleProtectedRoute from './RoleProtectedRoute'

function ProtectedRoutes () {
  return (
    <RoleProtectedRoute roles={['APPLICANT']}>
      <Outlet />
    </RoleProtectedRoute>
  )
}

export default ProtectedRoutes
