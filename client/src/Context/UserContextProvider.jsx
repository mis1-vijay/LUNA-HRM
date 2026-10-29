import { useState } from 'react'
import PropTypes from 'prop-types'
import UserContext from './userContext'
import axios from 'axios'
import {
  API_BASE_URL,
  apiRequestConfig,
  clearAuthenticatedAccount,
  readStoredAccount,
  readStoredToken,
  storeAuthenticatedAccount
} from '../API/apiClient'

const isApplicant = account => account?.role === 'APPLICANT'
const isAdminRole = account =>
  ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(account?.role)

function UserContextProvider ({ children }) {
  const [account, setAccount] = useState(readStoredAccount)
  const [getJob, setGetJob] = useState(null)
  const [authUser, setAuthUser] = useState(() => readStoredToken('userToken'))
  const [authAdmin, setAuthAdmin] = useState(() => readStoredToken('adminToken'))
  const [authEmployee, setAuthEmployee] = useState(() => readStoredToken('employeeToken'))

  const setUser = nextAccount => {
    const storedAccount = storeAuthenticatedAccount(nextAccount)
    setAccount(storedAccount)
    setAuthUser(readStoredToken('userToken'))
    setAuthAdmin(null)
    setAuthEmployee(null)
  }

  const setAdmin = nextAccount => {
    const storedAccount = storeAuthenticatedAccount(nextAccount)
    setAccount(storedAccount)
    setAuthUser(null)
    setAuthAdmin(readStoredToken('adminToken'))
    setAuthEmployee(null)
  }

  const setEmployee = nextAccount => {
    const storedAccount = storeAuthenticatedAccount(nextAccount)
    setAccount(storedAccount)
    setAuthUser(null)
    setAuthAdmin(null)
    setAuthEmployee(readStoredToken('employeeToken'))
  }

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/user-logout`, null, {
        ...apiRequestConfig('userToken')
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      localStorage.removeItem('userToken')
      clearAuthenticatedAccount()
      setAuthUser(null)
      setAccount(null)
    }
  }

  const logoutAdmin = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin-logout`, null, {
        withCredentials: true
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('employeeToken')
      clearAuthenticatedAccount()
      setAuthAdmin(null)
      setAuthEmployee(null)
      setAccount(null)
    }
  }

  return (
    <UserContext.Provider
      value={{
        user: isApplicant(account) ? account : null,
        admin: isAdminRole(account) ? account : null,
        currentAccount: account,
        setUser,
        setAdmin,
        setEmployee,
        logout,
        logoutAdmin,
        authUser,
        authAdmin,
        authEmployee,
        setAuthUser,
        setAuthAdmin,
        setAuthEmployee,
        setGetJob,
        getJob
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserContextProvider

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired
}
