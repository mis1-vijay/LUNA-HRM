import { useEffect, useState } from 'react';
import {
    MDBCard,
    MDBCardBody,
    MDBRow,
    MDBCol,
    MDBIcon,
    MDBBadge,
    MDBBtn,
    MDBTable,
    MDBTableHead,
    MDBTableBody,
    MDBSpinner,
    MDBListGroup,
    MDBListGroupItem
} from 'mdb-react-ui-kit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL, readStoredToken } from '../../../API/apiClient';

const LunaHRDashboard = () => {
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
                `${API_BASE_URL}/dashboard/hr`,
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
            toast.error('Failed to load HR dashboard');
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

    const recruitment = dashboardData?.recruitment || {};
    const leaveStats = dashboardData?.leaveStats || [];
    const leaveByType = dashboardData?.leaveByType || [];
    const attendanceApprovalStats = dashboardData?.attendanceApprovalStats || [];
    const pendingLeaves = dashboardData?.pendingLeaves || [];
    const pendingAttendances = dashboardData?.pendingAttendances || [];

    return (
        <div className="luna-hr-dashboard p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <h2 className="fw-bold" style={{ color: '#0d6efd' }}>
                        <MDBIcon fas icon="moon" className="me-2" />
                        Luna HRM - HR Manager Dashboard
                    </h2>
                    <p className="text-muted">Recruitment, Leaves & Attendance Management</p>
                </MDBCol>
                <MDBCol className="text-end">
                    <MDBBtn color="primary" outline onClick={fetchDashboardData}>
                        <MDBIcon fas icon="sync" className="me-2" />
                        Refresh
                    </MDBBtn>
                </MDBCol>
            </MDBRow>

            {/* Recruitment KPIs */}
            <MDBRow className="mb-4">
                <MDBCol md="6" className="mb-3">
                    <MDBCard className="shadow-sm border-0 border-start border-4" style={{ borderColor: '#0d6efd' }}>
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Pending Applications</h6>
                                    <h3 className="fw-bold">{recruitment.pendingApplications || 0}</h3>
                                    <small className="text-muted">Waiting for review</small>
                                </div>
                                <MDBIcon
                                    fas
                                    icon="file-alt"
                                    size="3x"
                                    style={{ color: '#0d6efd', opacity: 0.5 }}
                                />
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol md="6" className="mb-3">
                    <MDBCard className="shadow-sm border-0 border-start border-4" style={{ borderColor: '#198754' }}>
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">New Hires Today</h6>
                                    <h3 className="fw-bold">{recruitment.hiresToday || 0}</h3>
                                    <small className="text-muted">Onboarded employees</small>
                                </div>
                                <MDBIcon
                                    fas
                                    icon="user-plus"
                                    size="3x"
                                    style={{ color: '#198754', opacity: 0.5 }}
                                />
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Leave Analytics */}
            <MDBRow className="mb-4">
                <MDBCol lg="4" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h6 className="fw-bold mb-3">Leave Requests Status</h6>
                            <MDBListGroup flush>
                                {leaveStats.map((stat, idx) => (
                                    <MDBListGroupItem key={idx} className="px-0">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-capitalize">{stat._id || 'Unknown'}</span>
                                            <MDBBadge
                                                bg={
                                                    stat._id === 'pending'
                                                        ? 'warning'
                                                        : stat._id === 'approved'
                                                            ? 'success'
                                                            : 'danger'
                                                }
                                            >
                                                {stat.count}
                                            </MDBBadge>
                                        </div>
                                    </MDBListGroupItem>
                                ))}
                            </MDBListGroup>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol lg="4" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h6 className="fw-bold mb-3">Leave by Type</h6>
                            <MDBListGroup flush>
                                {leaveByType.map((leave, idx) => (
                                    <MDBListGroupItem key={idx} className="px-0">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-capitalize">{leave._id || 'Unknown'}</span>
                                            <span className="fw-bold">{leave.count}</span>
                                        </div>
                                    </MDBListGroupItem>
                                ))}
                            </MDBListGroup>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol lg="4" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h6 className="fw-bold mb-3">Attendance Approvals</h6>
                            <MDBListGroup flush>
                                {attendanceApprovalStats.map((stat, idx) => (
                                    <MDBListGroupItem key={idx} className="px-0">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-capitalize">{stat._id || 'Unknown'}</span>
                                            <MDBBadge
                                                bg={
                                                    stat._id === 'pending'
                                                        ? 'warning'
                                                        : stat._id === 'approved'
                                                            ? 'success'
                                                            : 'danger'
                                                }
                                            >
                                                {stat.count}
                                            </MDBBadge>
                                        </div>
                                    </MDBListGroupItem>
                                ))}
                            </MDBListGroup>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Pending Leave Requests */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">
                                <MDBIcon fas icon="calendar-times" className="me-2" />
                                Pending Leave Requests ({pendingLeaves.length})
                            </h5>
                            {pendingLeaves.length === 0 ? (
                                <p className="text-muted text-center py-4">No pending leave requests</p>
                            ) : (
                                <MDBTable hover responsive>
                                    <MDBTableHead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th scope="col">Employee</th>
                                            <th scope="col">Leave Type</th>
                                            <th scope="col">From - To</th>
                                            <th scope="col">Days</th>
                                            <th scope="col">Reason</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </MDBTableHead>
                                    <MDBTableBody>
                                        {pendingLeaves.map((leave, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <strong>
                                                        {leave.employee?.firstName} {leave.employee?.lastName}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <MDBBadge bg="info">
                                                        {leave.leaveType || 'N/A'}
                                                    </MDBBadge>
                                                </td>
                                                <td>
                                                    {new Date(leave.startDate).toLocaleDateString()} -{' '}
                                                    {new Date(leave.endDate).toLocaleDateString()}
                                                </td>
                                                <td>{leave.numberOfDays || 'N/A'}</td>
                                                <td>{leave.reason?.substring(0, 20)}...</td>
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
                            )}
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Pending Attendance Approvals */}
            <MDBRow>
                <MDBCol>
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">
                                <MDBIcon fas icon="clock" className="me-2" />
                                Pending Attendance Approvals ({pendingAttendances.length})
                            </h5>
                            {pendingAttendances.length === 0 ? (
                                <p className="text-muted text-center py-4">No pending attendance approvals</p>
                            ) : (
                                <MDBTable hover responsive>
                                    <MDBTableHead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th scope="col">Employee</th>
                                            <th scope="col">Date</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Work Hours</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </MDBTableHead>
                                    <MDBTableBody>
                                        {pendingAttendances.map((attendance, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <strong>
                                                        {attendance.employee?.firstName}{' '}
                                                        {attendance.employee?.lastName}
                                                    </strong>
                                                </td>
                                                <td>
                                                    {new Date(attendance.date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <MDBBadge bg="warning">
                                                        {attendance.status || 'N/A'}
                                                    </MDBBadge>
                                                </td>
                                                <td>{attendance.workHours || '0'} hrs</td>
                                                <td>
                                                    <MDBBtn
                                                        color="success"
                                                        size="sm"
                                                        className="me-2"
                                                    >
                                                        Approve
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
        </div>
    );
};

export default LunaHRDashboard;
