import axios, { API_BASE_URL, apiRequestConfig } from './apiClient'

const API_URL = `${API_BASE_URL}/api/v1`
const config = () => apiRequestConfig(localStorage.getItem('adminToken') ? 'adminToken' : 'employeeToken')

export const createEmployee = payload =>
  axios.post(`${API_URL}/employee/create`, payload, config())

export const getAllEmployees = () =>
  axios.get(`${API_URL}/employees`, config())

export const getEmployeeById = id =>
  axios.get(`${API_URL}/employee/${encodeURIComponent(id)}`, config())

export const updateEmployee = (id, payload) =>
  axios.put(`${API_URL}/employee/${encodeURIComponent(id)}`, payload, config())

export const deleteEmployee = id =>
  axios.delete(`${API_URL}/employee/${encodeURIComponent(id)}`, config())

export const getDepartmentStats = () =>
  axios.get(`${API_URL}/stats/departments`, config())
