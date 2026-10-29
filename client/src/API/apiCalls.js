import axios, {
  API_BASE_URL,
  apiRequestConfig,
  clearAuthenticatedAccount,
  storeAuthenticatedAccount,
  tokenHeaders
} from './apiClient'

const API_URL = API_BASE_URL

export const userRegister = payload =>
  axios.post(`${API_URL}/user-register`, payload, { withCredentials: true })

export const userLogin = async payload => {
  const response = await axios.post(`${API_URL}/user-login`, payload, { withCredentials: true })
  localStorage.removeItem('adminToken')
  localStorage.removeItem('employeeToken')
  storeAuthenticatedAccount(response.data.isUser)
  localStorage.setItem('userToken', JSON.stringify(response.data.token))
  return response
}

export const getAllJobs = () =>
  axios.get(`${API_URL}/all-jobs`, {
    withCredentials: true,
    headers: { Accept: 'application/json', ...tokenHeaders('userToken') }
  })

export const getRecentJobs = days =>
  axios.get(`${API_URL}/recent-jobs`, { params: days ? { days } : {} })

export const getSingleJob = id =>
  axios.get(`${API_URL}/single-job/${encodeURIComponent(id)}`)

export const applyForJob = (id, payload) =>
  axios.post(`${API_URL}/user-apply/${encodeURIComponent(id)}`, payload, apiRequestConfig('userToken'))

export const getAppliedJobs = id =>
  axios.get(`${API_URL}/getapplied-jobs/${encodeURIComponent(id)}`, apiRequestConfig('userToken'))

export const updateUser = (id, payload) =>
  axios.put(`${API_URL}/update-user/${encodeURIComponent(id)}`, payload, apiRequestConfig('userToken'))

export const userLogout = () =>
  axios.post(`${API_URL}/user-logout`, null, { withCredentials: true }).finally(() => {
    localStorage.removeItem('userToken')
    clearAuthenticatedAccount()
  })
