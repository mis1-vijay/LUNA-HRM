import axios from 'axios'

const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1')
  .replace(/\/+$/, '')

export const API_BASE_URL = configuredApiUrl.endsWith('/api/v1')
  ? configuredApiUrl
  : `${configuredApiUrl}/api/v1`

export function readStoredToken(key) {
  const stored = localStorage.getItem(key)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return stored
  }
}

export function readStoredAccount() {
  try {
    const account = JSON.parse(localStorage.getItem('accountUser'))
    return account && typeof account === 'object' ? account : null
  } catch {
    return null
  }
}

export function storeAuthenticatedAccount(account) {
  if (!account || typeof account !== 'object' || typeof account.role !== 'string') {
    throw new Error('Authentication response did not contain a valid account.')
  }

  const normalizedAccount = {
    ...account,
    role: account.role.toUpperCase(),
    id: account.id || account._id
  }
  localStorage.setItem('accountUser', JSON.stringify(normalizedAccount))
  localStorage.setItem('accountRole', normalizedAccount.role)
  return normalizedAccount
}

export function clearAuthenticatedAccount() {
  localStorage.removeItem('accountUser')
  localStorage.removeItem('accountRole')
}

export function tokenHeaders(key) {
  const token = readStoredToken(key)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function apiRequestConfig(key) {
  return {
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...tokenHeaders(key)
    }
  }
}

axios.interceptors.request.use(config => {
  const path = config.url || ''
  let tokenKey
  if (path.includes('/dashboard/employee') || path.includes('/employee-login')) {
    tokenKey = 'employeeToken'
  } else if (path.includes('/dashboard/') || path.includes('/employee/')) {
    tokenKey = 'adminToken'
  } else if (/\/(?:user-|all-jobs|getapplied-jobs|update-user)/.test(path)) {
    tokenKey = 'userToken'
  } else if (/\/admin-/.test(path)) {
    tokenKey = 'adminToken'
  }
  const token = tokenKey ? readStoredToken(tokenKey) : null
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default axios
