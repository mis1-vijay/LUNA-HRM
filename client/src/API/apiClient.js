import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function readStoredToken(key) {
  const stored = localStorage.getItem(key)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return stored
  }
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
  const requestUrl = config.url || ''
  if (/^https?:\/\/(localhost|127\.0\.0\.1):5000\b/.test(requestUrl) ||
    /^https:\/\/hrms-server-gilt\.vercel\.app\b/.test(requestUrl)) {
    config.url = requestUrl.replace(
      /^https?:\/\/(?:localhost|127\.0\.0\.1):5000|^https:\/\/hrms-server-gilt\.vercel\.app/,
      API_BASE_URL
    )
  }

  const employeeDashboard = config.url?.match(/\/api\/v1\/dashboard\/employee(?:\/[^/?]+)?/)
  if (employeeDashboard) {
    config.url = config.url.replace(employeeDashboard[0], '/api/v1/dashboard/employee')
    config.headers = config.headers || {}
    const employeeToken = readStoredToken('employeeToken')
    if (employeeToken) config.headers.Authorization = `Bearer ${employeeToken}`
  }

  const path = config.url || ''
  let tokenKey
  if (path.includes('/dashboard/employee') || path.includes('/employee-login')) {
    tokenKey = 'employeeToken'
  } else if (path.includes('/dashboard/') || path.includes('/employee/')) {
    tokenKey = 'adminToken'
  } else if (/\/api\/v1\/(?:user-|all-jobs|getapplied-jobs|update-user)/.test(path)) {
    tokenKey = 'userToken'
  } else if (/\/api\/v1\/(?:admin-)/.test(path)) {
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
