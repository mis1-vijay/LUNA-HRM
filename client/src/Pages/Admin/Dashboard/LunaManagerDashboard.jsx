import { useEffect, useState } from 'react';
import {
    MDBCard,
    MDBCardBody,
    MDBRow,
    MDBCol,
    MDBIcon,
    MDBBtn,
    MDBTable,
    MDBTableHead,
    MDBTableBody,
    MDBSpinner,
    MDBBadge,
    MDBListGroup,
    MDBListGroupItem
} from 'mdb-react-ui-kit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL, readStoredToken } from '../../../API/apiClient';

const LunaManagerDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = readStoredToken('adminToken');
            const response = await axios.get(
                `${API_BASE_URL}/dashboard/manager`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            setDashboardData(response.data.data);
        } catch (error) {
            toast.error('Failed to load manager dashboard');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <MDBSpinner role="status">
                    <span className="visually-hidden">Loading...</span>
                </MDBSpinner>
            </div>
        );
    }

    const department = dashboardData?.department || {};
    const teamSize = dashboardData?.teamSize || 0;
    const teamMembers = dashboardData?.teamMembers || [];
    const teamAttendance = dashboardData?.teamAttendance || [];
    const teamLeaves = dashboardData?.teamLeaves || [];
    const pendingReviews = dashboardData?.pendingReviews || 0;

    const getAttendanceCount = (status) => {
        const item = teamAttendance.find(a => a._id === status);
        return item?.count || 0;
    };

    return (
        <div className="luna-manager-dashboard p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <h2 className="fw-bold" style={{ color: '#0d6efd' }}>
                        <MDBIcon fas icon="moon" className="me-2" />
                        Luna HRM - Department Manager Dashboard
                    </h2>
                    <p className="text-muted">
                        <MDBIcon fas icon="building" className="me-2" />
                        {department.departmentName || 'Department'}
                    </p>
                </MDBCol>
                <MDBCol className="text-end">
                    <MDBBtn color="primary" outline onClick={fetchDashboardData}>
                        <MDBIcon fas icon="sync" className="me-2" />
                        Refresh
                    </MDBBtn>
                </MDBCol>
            </MDBRow>

            {/* Team Overview Cards */}
            <MDBRow className="mb-4">
                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0 border-start border-4" style={{ borderColor: '#0d6efd' }}>
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Team Size</h6>
                                    <h3 className="fw-bold">{teamSize}</h3>
                                    <small className="text-muted">Active Members</small>
                                </div>
                                <MDBIcon
                                    fas
                                    icon="users"
                                    size="3x"
                                    style={{ color: '#0d6efd', opacity: 0.5 }}
                                />
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0 border-start border-4" style={{ borderColor: '#198754' }}>
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Present Today</h6>
                                    <h3 className="fw-bold">{getAttendanceCount('present')}</h3>
                                    <small className="text-muted">
                                        {teamSize > 0 ? Math.round((getAttendanceCount('present') / teamSize) * 100) : 0}% rate
                                    </small>
                                </div>
                                <MDBIcon
                                    fas
                                    icon="check-circle"
                                    size="3x"
                                    style={{ color: '#198754', opacity: 0.5 }}
                                />
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0 border-start border-4" style={{ borderColor: '#fd7e14' }}>
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">On Leave</h6>
                                    <h3 className="fw-bold">{teamLeaves.length}</h3>
                                    <small className="text-muted">Pending Requests</small>
                                </div>
                                <MDBIcon
                                    fas
                                    icon="calendar-times"
                                    size="3x"
                                    style={{ color: '#fd7e14', opacity: 0.5 }}
                                />
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0 border-start border-4" style={{ borderColor: '#dc3545' }}>
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Reviews Pending</h6>
                                    <h3 className="fw-bold">{pendingReviews}</h3>
                                    <small className="text-muted">To Complete</small>
                                </div>
                                <MDBIcon
                                    fas
                                    icon="tasks"
                                    size="3x"
                                    style={{ color: '#dc3545', opacity: 0.5 }}
                                />
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Team Attendance Summary */}
            <MDBRow className="mb-4">
                <MDBCol lg="4" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">Today&apos;s Attendance</h5>
                            <MDBListGroup flush>
                                <MDBListGroupItem className="px-0">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <MDBIcon fas icon="check-circle" className="text-success me-2" />
                                            Present
                                        </span>
                                        <MDBBadge bg="success">{getAttendanceCount('present')}</MDBBadge>
                                    </div>
                                </MDBListGroupItem>
                                <MDBListGroupItem className="px-0">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <MDBIcon fas icon="times-circle" className="text-danger me-2" />
                                            Absent
                                        </span>
                                        <MDBBadge bg="danger">{getAttendanceCount('absent')}</MDBBadge>
                                    </div>
                                </MDBListGroupItem>
                                <MDBListGroupItem className="px-0">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <MDBIcon fas icon="clock" className="text-warning me-2" />
                                            Late
                                        </span>
                                        <MDBBadge bg="warning">{getAttendanceCount('late')}</MDBBadge>
                                    </div>
                                </MDBListGroupItem>
                                <MDBListGroupItem className="px-0">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <MDBIcon fas icon="calendar" className="text-info me-2" />
                                            On Leave
                                        </span>
                                        <MDBBadge bg="info">{getAttendanceCount('on_leave')}</MDBBadge>
                                    </div>
                                </MDBListGroupItem>
                            </MDBListGroup>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                {/* Department Info */}
                <MDBCol lg="4" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">Department Information</h5>
                            <MDBListGroup flush>
                                <MDBListGroupItem className="px-0">
                                    <p className="text-muted mb-1">Department Name</p>
                                    <h6 className="fw-bold">{department.departmentName || 'N/A'}</h6>
                                </MDBListGroupItem>
                                <MDBListGroupItem className="px-0">
                                    <p className="text-muted mb-1">Department Code</p>
                                    <h6 className="fw-bold">{department.departmentCode || 'N/A'}</h6>
                                </MDBListGroupItem>
                                <MDBListGroupItem className="px-0">
                                    <p className="text-muted mb-1">Total Employees</p>
                                    <h6 className="fw-bold">{department.numberOfEmployees || teamSize}</h6>
                                </MDBListGroupItem>
                                <MDBListGroupItem className="px-0">
                                    <p className="text-muted mb-1">Department Status</p>
                                    <MDBBadge bg="success">{department.status || 'active'}</MDBBadge>
                                </MDBListGroupItem>
                            </MDBListGroup>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                {/* Quick Actions */}
                <MDBCol lg="4" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">Quick Actions</h5>
                            <MDBBtn color="primary" block className="mb-2">
                                <MDBIcon fas icon="file" className="me-2" />
                                Approve Attendance
                            </MDBBtn>
                            <MDBBtn color="success" block className="mb-2">
                                <MDBIcon fas icon="calendar-check" className="me-2" />
                                Approve Leaves
                            </MDBBtn>
                            <MDBBtn color="info" block className="mb-2">
                                <MDBIcon fas icon="star" className="me-2" />
                                Write Performance Reviews
                            </MDBBtn>
                            <MDBBtn color="warning" block>
                                <MDBIcon fas icon="chart-bar" className="me-2" />
                                View Reports
                            </MDBBtn>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Team Members Table */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">
                                <MDBIcon fas icon="users" className="me-2" />
                                Team Members ({teamMembers.length})
                            </h5>
                            {teamMembers.length === 0 ? (
                                <p className="text-muted text-center py-4">No team members assigned</p>
                            ) : (
                                <MDBTable hover responsive>
                                    <MDBTableHead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th scope="col">Name</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">Designation</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </MDBTableHead>
                                    <MDBTableBody>
                                        {teamMembers.map((member, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <strong>
                                                        {member.firstName} {member.lastName}
                                                    </strong>
                                                </td>
                                                <td>{member.email}</td>
                                                <td>{member.designation?.designationName || 'N/A'}</td>
                                                <td>
                                                    <MDBBadge
                                                        bg={
                                                            member.status === 'active'
                                                                ? 'success'
                                                                : member.status === 'on_leave'
                                                                    ? 'warning'
                                                                    : 'danger'
                                                        }
                                                    >
                                                        {member.status}
                                                    </MDBBadge>
                                                </td>
                                                <td>
                                                    <MDBBtn color="info" size="sm" className="me-2">
                                                        View
                                                    </MDBBtn>
                                                </td>
                                            </tr>
                                        ))}
                                    </MDBTableBody>
                                </MDBTable>
                            )}
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Pending Leave Requests */}
            {teamLeaves.length > 0 && (
                <MDBRow>
                    <MDBCol>
                        <MDBCard className="shadow-sm border-0">
                            <MDBCardBody>
                                <h5 className="fw-bold mb-4">
                                    <MDBIcon fas icon="calendar-times" className="me-2" />
                                    Team Leave Requests Pending Approval
                                </h5>
                                <MDBTable hover responsive>
                                    <MDBTableHead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th scope="col">Employee</th>
                                            <th scope="col">Leave Type</th>
                                            <th scope="col">From - To</th>
                                            <th scope="col">Days</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </MDBTableHead>
                                    <MDBTableBody>
                                        {teamLeaves.map((leave, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <strong>
                                                        {leave.employee?.firstName} {leave.employee?.lastName}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <MDBBadge bg="info">{leave.leaveType}</MDBBadge>
                                                </td>
                                                <td>
                                                    {new Date(leave.startDate).toLocaleDateString()} -{' '}
                                                    {new Date(leave.endDate).toLocaleDateString()}
                                                </td>
                                                <td>{leave.numberOfDays}</td>
                                                <td>
                                                    <MDBBtn
                                                        color="success"
                                                        size="sm"
                                                        className="me-2"
                                                    >
                                                        Approve
                                                    </MDBBtn>
                                                    <MDBBtn
                                                        color="danger"
                                                        size="sm"
                                                    >
                                                        Reject
                                                    </MDBBtn>
                                                </td>
                                            </tr>
                                        ))}
                                    </MDBTableBody>
                                </MDBTable>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            )}
        </div>
    );
};

export default LunaManagerDashboard;
