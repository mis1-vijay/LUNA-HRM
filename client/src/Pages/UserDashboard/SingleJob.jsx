import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { API_BASE_URL, tokenHeaders } from '../../API/apiClient'
import Sidebar from './Sidebar'

function SingleJob () {
  const [jobDetails, setJobDetails] = useState({})
  const { id } = useParams()

  useEffect(() => {
    const handleJob = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/single-job/${id}`, {
          withCredentials: true,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...tokenHeaders('userToken')
          }
        })
        setJobDetails(response.data.singleJob)
      } catch (error) {
        console.error('Unable to load job details:', error)
      }
    }

    handleJob()
  }, [id])

  return (
    <div className='board'>
      <Sidebar />
      <div className='main__board text-white vh-100 d-flex flex-column align-items-start p-5'>
        <h1>{jobDetails.jobTitle}</h1>
        <p>{jobDetails.jobDescription}</p>
        <p>{jobDetails.companyName}</p>
        <p>{jobDetails.startDate}</p>
        <p>{jobDetails.endDate}</p>
        <Link className='btn btn-primary' to={`/dashboard/apply-job/${jobDetails.id || jobDetails._id}`}>Apply Now</Link>
      </div>
    </div>
  )
}

export default SingleJob
