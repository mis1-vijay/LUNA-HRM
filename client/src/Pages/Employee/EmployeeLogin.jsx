import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeLogin } from '../../API/adminApiCalls'
import UserContext from '../../Context/userContext'

function EmployeeLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setEmployee } = useContext(UserContext)

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await employeeLogin({ email, password })
      setEmployee(response.data.isEmployee)
      navigate('/employee-dashboard')
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container py-5">
      <form className="mx-auto" style={{ maxWidth: 420 }} onSubmit={handleSubmit}>
        <h1 className="h3 mb-4">Employee sign in</h1>
        <label className="form-label" htmlFor="employee-email">Email</label>
        <input
          id="employee-email"
          className="form-control mb-3"
          type="email"
          autoComplete="username"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
        />
        <label className="form-label" htmlFor="employee-password">Password</label>
        <input
          id="employee-password"
          className="form-control mb-3"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
        />
        {error && <p className="text-danger" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export default EmployeeLogin
