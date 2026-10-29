import { Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { readStoredToken } from '../API/apiClient'

const PRISMA_ROLES = new Set([
  'ADMIN',
  'HR_MANAGER',
  'DEPARTMENT_MANAGER',
  'EMPLOYEE',
  'APPLICANT'
])

function getTokenPayload(token) {
  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return null
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    return JSON.parse(payload)
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
    .find(candidate =>
      candidate &&
      PRISMA_ROLES.has(candidate.role) &&
      Number(candidate.exp) * 1000 > Date.now() &&
      roles.includes(candidate.role)
    )

  if (!payload) {
    const redirect = roles.includes('EMPLOYEE') ? '/employee-login' :
      roles.includes('APPLICANT') ? '/login' : '/admin-login'
    return <Navigate to={redirect} replace />
  }
  return children
}

export default RoleProtectedRoute

RoleProtectedRoute.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.oneOf([
    'ADMIN',
    'HR_MANAGER',
    'DEPARTMENT_MANAGER',
    'EMPLOYEE',
    'APPLICANT'
  ])).isRequired,
  children: PropTypes.node.isRequired
}
