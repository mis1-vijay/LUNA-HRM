import React, { useEffect, useState } from 'react';
import AdminSidebar from '../Sidebar/AdminSidebar';
import { getAllUsers, getAllJobs } from '../../../API/adminApiCalls';
import { getAllEmployees, getDepartmentStats } from '../../../API/employeeApiCalls';
import ReactApexChart from 'react-apexcharts';
import { MDBIcon } from 'mdb-react-ui-kit';

function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [departmentStats, setDepartmentStats] = useState([]);

  const handleGetAllUsers = async () => {
    try {
      const response = await getAllUsers();
      setTotalUsers(response.data.allUsers);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleGetAllJobs = async () => {
    try {
      const response = await getAllJobs();
      setTotalJobs(response.data.jobsCount);
    } catch (error) {
      console.error('Error fetching jobs data:', error);
    }
  };

  const handleGetAllEmployees = async () => {
    try {
      const response = await getAllEmployees();
      setTotalEmployees(response.data.employees.length);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleGetDepartmentStats = async () => {
    try {
      const response = await getDepartmentStats();
      setDepartmentStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  useEffect(() => {
    handleGetAllUsers();
    handleGetAllJobs();
    handleGetAllEmployees();
    handleGetDepartmentStats();
  }, []);

  const chartOptions = {
    chart: {
      height: 350,
      type: 'bar',
    },
    colors: ['#0174BE', '#087FDD'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },
    xaxis: {
      categories: departmentStats.map(stat => stat.departmentInfo?.[0]?.departmentName || 'Department'),
    },
    tooltip: {
      theme: 'dark',
    },
  };

  const chartSeries = [
    {
      name: 'Total Employees',
      data: departmentStats.map(stat => stat.totalEmployees),
    },
    {
      name: 'Avg Salary (in thousands)',
      data: departmentStats.map(stat => Math.round(stat.avgSalary / 1000)),
    },
  ];

  const StatCard = ({ icon, title, value, bgColor }) => (
    <div className='d-flex flex-column justify-content-center align-items-center p-4 rounded text-white' style={{ background: bgColor, minHeight: '150px', flex: 1 }}>
      <MDBIcon fas icon={icon} size='2x' className='mb-3' />
      <p className='fs-5 fw-bold'>{value}</p>
      <p className='text-center'>{title}</p>
    </div>
  );

  return (
    <div className='board'>
      <AdminSidebar />
      <div className='main__board p-4'>
        <h1 className='text-white mb-4'>
          <MDBIcon fas icon='tachometer-alt' className='me-3' />
          HRM System Dashboard
        </h1>
        
        <div className='d-flex gap-3 mb-4' style={{ flexWrap: 'wrap' }}>
          <StatCard icon='users' title='Total Users' value={totalUsers} bgColor='#0174BE' />
          <StatCard icon='briefcase' title='Job Postings' value={totalJobs} bgColor='#087FDD' />
          <StatCard icon='id-badge' title='Total Employees' value={totalEmployees} bgColor='#0574B8' />
          <StatCard icon='chart-pie' title='Departments' value={departmentStats.length} bgColor='#004E9C' />
        </div>

        <div className='rounded-3 p-3' style={{ background: '#f8f9fa' }}>
          <h4 className='mb-3 text-dark fw-bold'>
            <MDBIcon fas icon='chart-bar' className='me-2' />
            Department Overview
          </h4>
          {departmentStats.length > 0 ? (
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type='bar'
              height={350}
            />
          ) : (
            <p className='text-muted'>No department data available</p>
          )}
        </div>

        <div className='row mt-4'>
          <div className='col-md-6'>
            <div className='card shadow-sm'>
              <div className='card-body'>
                <h5 className='card-title'>
                  <MDBIcon fas icon='info-circle' className='me-2' />
                  System Features
                </h5>
                <ul className='list-unstyled'>
                  <li><MDBIcon fas icon='check-circle' className='me-2 text-success' />Employee Management</li>
                  <li><MDBIcon fas icon='check-circle' className='me-2 text-success' />Attendance Tracking</li>
                  <li><MDBIcon fas icon='check-circle' className='me-2 text-success' />Leave Management</li>
                  <li><MDBIcon fas icon='check-circle' className='me-2 text-success' />Payroll System</li>
                  <li><MDBIcon fas icon='check-circle' className='me-2 text-success' />Performance Reviews</li>
                </ul>
              </div>
            </div>
          </div>
          <div className='col-md-6'>
            <div className='card shadow-sm'>
              <div className='card-body'>
                <h5 className='card-title'>
                  <MDBIcon fas icon='tasks' className='me-2' />
                  Quick Stats
                </h5>
                <p className='mb-2'>
                  <strong>Active Employees:</strong> <span className='badge bg-success'>{totalEmployees}</span>
                </p>
                <p className='mb-2'>
                  <strong>Open Positions:</strong> <span className='badge bg-primary'>{totalJobs}</span>
                </p>
                <p className='mb-2'>
                  <strong>Department Count:</strong> <span className='badge bg-info'>{departmentStats.length}</span>
                </p>
                <p className='mb-0'>
                  <strong>Job Applicants:</strong> <span className='badge bg-warning'>{totalUsers}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
