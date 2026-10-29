import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../API/apiClient'

function RecentJobs () {
  const [recentJob, setRecentJobs] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const handleRecentJobs = useCallback(async () => {
    try {
      setLoadError('')
      const response = await axios.get(`${API_BASE_URL}/recent-jobs`, {
        withCredentials: true
      })
      if (!Array.isArray(response.data?.recentJobs)) {
        throw new Error('Recent jobs response has an invalid format.')
      }
      setRecentJobs(response.data.recentJobs)
    } catch (err) {
      console.error('Failed to load recent jobs:', err)
      setLoadError('Recent jobs are temporarily unavailable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
      return description.substring(0, maxLength) + '...'
    }
    return description
  }

  useEffect(() => {
    handleRecentJobs()
  }, [handleRecentJobs])

  
  return (
    <div className='row container-fluid'>
      <h4 className='text-center fw-bold fs-3 p-4'>Recent Jobs</h4>
      {loading && <p className='text-center' role='status'>Loading recent jobs…</p>}
      {!loading && loadError && <p className='text-center text-danger' role='alert'>{loadError}</p>}
      {!loading && !loadError && recentJob.length === 0 && (
        <p className='text-center'>No recent jobs are currently available.</p>
      )}
      {recentJob.map((job, index) => (
        <div key={index} className='mb-3 mb-md-0 col-lg-6 col-12 p-2 shadow-4'>
          <div className='card'>
            <div className='card-body'>
              <h5 className='card-title'>
                <b>Job Title:</b> {job.jobTitle}
              </h5>
              <p className='card-text'>
                <b>Job Description: </b>
                {truncateDescription(job.jobDescription, 150)}
              </p>
              <p className='card-text'>
                <b>Company: </b>
                {job.companyName}
              </p>
              <ul className='list-unstyled d-flex gap-2'>
                <li>
                  <b>Date: </b>
                </li>
                <li>
                  {job.startDate} - {job.endDate}
                </li>
              </ul>
              <Link
                to={`/dashboard/single-job/${job._id}`}
                className='btn btn-primary'
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecentJobs
