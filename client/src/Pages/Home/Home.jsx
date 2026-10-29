import React from 'react'
import Header from '../../Components/Header/Header'
import './home.scss'
import Footer from '../../Components/Footer/Footer'
import About from '../../Components/About/About'
import { TypeAnimation } from 'react-type-animation'
import { Link } from 'react-router-dom'
import Team from '../../Components/Team/Team'
import RecentJobs from '../../Components/RecentJobs/RecentJobs'

function Home () {
  return (
    <div>
      <Header />
      <div className='home_layout'>
        <div className='home_content'>
          <h1 id='home_typer'>
            <span>Luna </span>
            <span>
              <TypeAnimation
                sequence={[
                  'HRM System',
                  1000,
                  'Management',
                  2000,
                  'Excellence',
                  2000,
                  () => {
                    console.log('Sequence completed')
                  }
                ]}
                wrapper='span'
                cursor={true}
                repeat={Infinity}
                style={{ color: '#0174BE', textAlign: 'center' }}
              />
            </span>
          </h1>

          <p>
            Luna HRM is a comprehensive Human Resource Management System for modern organizations,
            offering employee management, attendance tracking, payroll processing, and performance
            management for <em style={{ color: '#0174BE' }}>HR professionals</em> and
            &nbsp; <em style={{ color: '#0174BE' }}>administrators.</em>
          </p>
          <div className='btns'>
            <button id='getStartedBtn'>
              <Link to={'/admin-dashboard'} className='text-white'>
                View Admin Dashboard
              </Link>
            </button>
            <button id='getStartedBtn' style={{marginLeft: '10px', backgroundColor: '#666'}}>
              <Link to={'/employee-dashboard'} className='text-white'>
                Employee Portal
              </Link>
            </button>
          </div>
        </div>
      </div>
      <About />
      <RecentJobs />
      <Team />
      <Footer />
    </div>
  )
}

export default Home
