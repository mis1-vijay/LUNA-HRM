import axios, { API_BASE_URL, apiRequestConfig } from './apiClient'

const API_URL = `${API_BASE_URL}/api/v1`

export const adminRegister = (payload, bootstrapKey) =>
  axios.post(`${API_URL}/admin-register`, payload, {
    withCredentials: true,
    headers: bootstrapKey ? { 'x-admin-bootstrap-key': bootstrapKey } : {}
  })

export const adminLogin = async payload => {
  const response = await axios.post(`${API_URL}/admin-login`, payload, { withCredentials: true })
  localStorage.removeItem('userToken')
  localStorage.removeItem('employeeToken')
  localStorage.setItem('adminToken', JSON.stringify(response.data.token))
  localStorage.setItem('accountRole', response.data.isAdmin.role)
  return response
}

export const employeeLogin = async payload => {
  const response = await axios.post(`${API_URL}/employee-login`, payload, { withCredentials: true })
  localStorage.removeItem('userToken')
  localStorage.removeItem('adminToken')
  localStorage.setItem('employeeToken', JSON.stringify(response.data.token))
  localStorage.setItem('accountRole', response.data.isEmployee.role)
  return response
}

export const getAllUsers = () =>
  axios.get(`${API_URL}/admin-all-users`, apiRequestConfig('adminToken'))

export const getUsers = () =>
  axios.get(`${API_URL}/users`, apiRequestConfig('adminToken'))

export const getAllJobs = () =>
  axios.get(`${API_URL}/admin-total-jobs`, apiRequestConfig('adminToken'))

export const adminCreateJobs = payload =>
  axios.post(`${API_URL}/admin-create-jobs`, payload, apiRequestConfig('adminToken'))
