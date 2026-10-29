import { Navigate } from 'react-router-dom'
import { readStoredToken } from '../API/apiClient'

function getTokenPayload(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

function RoleProtectedRoute({ roles, children }) {
  const keys = ['employeeToken', 'adminToken', 'userToken']
  const payload = keys
    .map(readStoredToken)
    .filter(Boolean)
    .map(getTokenPayload)
    .find(candidate => candidate && candidate.exp * 1000 > Date.now() && roles.includes(candidate.role))

  if (!payload) {
    const redirect = roles.includes('EMPLOYEE') ? '/employee-login' :
      roles.includes('APPLICANT') ? '/login' : '/admin-login'
    return <Navigate to={redirect} replace />
  }
  return children
}

export default RoleProtectedRoute
