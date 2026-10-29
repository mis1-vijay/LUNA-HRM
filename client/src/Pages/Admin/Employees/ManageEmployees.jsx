import { useState, useEffect } from 'react'
import { MDBBtn, MDBIcon, MDBInput } from 'mdb-react-ui-kit'
import AdminSidebar from '../Sidebar/AdminSidebar'
import { getAllEmployees, deleteEmployee } from '../../../API/employeeApiCalls'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

function ManageEmployees() {
    const [employees, setEmployees] = useState([])
    const [filteredEmployees, setFilteredEmployees] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)

    const handleGetAllEmployees = async () => {
        setLoading(true)
        try {
            const response = await getAllEmployees()
            setEmployees(response.data.employees || [])
            setFilteredEmployees(response.data.employees || [])
        } catch (error) {
            console.error('Error fetching employees:', error)
            toast.error('Failed to fetch employees')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to terminate this employee?')) {
            try {
                await deleteEmployee(id)
                toast.success('Employee terminated successfully')
                handleGetAllEmployees()
            } catch (error) {
                console.error('Error deleting employee:', error)
                toast.error('Failed to terminate employee')
            }
        }
    }

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase()
        setSearchTerm(term)
        const filtered = employees.filter(emp =>
            emp.firstName.toLowerCase().includes(term) ||
            emp.lastName.toLowerCase().includes(term) ||
            emp.email.toLowerCase().includes(term) ||
            emp.employeeId.toLowerCase().includes(term)
        )
        setFilteredEmployees(filtered)
    }

    useEffect(() => {
        handleGetAllEmployees()
    }, [])

    return (
        <div className='board'>
            <AdminSidebar />
            <div className='main__board p-4'>
                <h1 className='text-white mb-4'>
                    <MDBIcon fas icon='users' className='me-3' />
                    Manage Employees
                </h1>

                <div className='card shadow-sm mb-4'>
                    <div className='card-body'>
                        <div className='d-flex justify-content-between align-items-center mb-3'>
                            <h5 className='card-title mb-0'>
                                <MDBIcon fas icon='list' className='me-2' />
                                Employee List ({filteredEmployees.length})
                            </h5>
                            <Link to='/admin-dashboard/add-employee' className='btn btn-primary'>
                                <MDBIcon fas icon='plus' className='me-2' />
                                Add Employee
                            </Link>
                        </div>

                        <MDBInput
                            label='Search employees by name, email, or ID'
                            icon='search'
                            type='text'
                            value={searchTerm}
                            onChange={handleSearch}
                            className='mb-3'
                        />

                        {loading ? (
                            <div className='text-center'>
                                <div className='spinner-border' role='status'>
                                    <span className='sr-only'>Loading...</span>
                                </div>
                            </div>
                        ) : filteredEmployees.length > 0 ? (
                            <div className='table-responsive'>
                                <table className='table table-hover'>
                                    <thead className='table-light'>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                            <th>Salary</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map((employee) => (
                                            <tr key={employee._id}>
                                                <td className='fw-bold'>{employee.employeeId}</td>
                                                <td>{employee.firstName} {employee.lastName}</td>
                                                <td>{employee.email}</td>
                                                <td>{employee.department?.departmentName || 'N/A'}</td>
                                                <td>{employee.designation?.designationName || 'N/A'}</td>
                                                <td>₹{employee.salary?.toLocaleString() || 'N/A'}</td>
                                                <td>
                                                    <span className={`badge bg-${
                                                        employee.status === 'active' ? 'success' :
                                                        employee.status === 'on_leave' ? 'warning' :
                                                        'danger'
                                                    }`}>
                                                        {employee.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/admin-dashboard/edit-employee/${employee._id}`}
                                                        className='btn btn-sm btn-primary me-2'
                                                    >
                                                        <MDBIcon fas icon='edit' />
                                                    </Link>
                                                    <MDBBtn
                                                        size='sm'
                                                        color='danger'
                                                        onClick={() => handleDelete(employee._id)}
                                                    >
                                                        <MDBIcon fas icon='trash' />
                                                    </MDBBtn>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className='alert alert-info'>No employees found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ManageEmployees
