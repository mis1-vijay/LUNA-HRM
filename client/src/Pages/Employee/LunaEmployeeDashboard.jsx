import React, { useEffect, useState } from 'react';
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
    MDBTabs,
    MDBTabsItem,
    MDBTabsLink,
    MDBTabsContent,
    MDBTabsPane,
    MDBListGroup,
    MDBListGroupItem
} from 'mdb-react-ui-kit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../API/apiClient';

const LunaEmployeeDashboard = ({ employeeId }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchDashboardData();
    }, [employeeId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('adminToken'));
            const response = await axios.get(
                `${API_BASE_URL}/api/v1/dashboard/employee`,
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
            toast.error('Failed to load employee dashboard');
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

    const employee = dashboardData?.employee || {};
    const attendance = dashboardData?.attendance || {};
    const leaveBalance = dashboardData?.leaveBalance || {};
    const latestPayslip = dashboardData?.latestPayslip || {};
    const leaveRequests = dashboardData?.leaveRequests || [];
    const performanceRating = dashboardData?.performanceRating || {};

    return (
        <div className="luna-employee-dashboard p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header with Employee Info */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <MDBCard className="shadow-sm border-0" style={{ backgroundColor: '#0d6efd' }}>
                        <MDBCardBody className="text-white">
                            <MDBRow>
                                <MDBCol md="8">
                                    <h2 className="fw-bold mb-3">
                                        <MDBIcon fas icon="moon" className="me-2" />
                                        Welcome, {employee.firstName} {employee.lastName}
                                    </h2>
                                    <p className="mb-2">
                                        <MDBIcon fas icon="briefcase" className="me-2" />
                                        {employee.designation?.designationName || 'N/A'}
                                    </p>
                                    <p className="mb-2">
                                        <MDBIcon fas icon="building" className="me-2" />
                                        {employee.department?.departmentName || 'N/A'}
                                    </p>
                                    <p className="mb-0">
                                        <MDBIcon fas icon="envelope" className="me-2" />
                                        {employee.email}
                                    </p>
                                </MDBCol>
                                <MDBCol md="4" className="text-end">
                                    <img
                                        src={employee.profileImage || 'https://via.placeholder.com/150'}
                                        alt="Profile"
                                        className="rounded-circle"
                                        style={{ width: '150px', height: '150px', objectFit: 'cover', border: '3px solid white' }}
                                    />
                                </MDBCol>
                            </MDBRow>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Key Metrics */}
            <MDBRow className="mb-4">
                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody className="text-center">
                            <h5 className="text-muted mb-2">Present Days</h5>
                            <h3 className="fw-bold text-success">{attendance.presentDays || 0}</h3>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody className="text-center">
                            <h5 className="text-muted mb-2">Absent Days</h5>
                            <h3 className="fw-bold text-danger">{attendance.absentDays || 0}</h3>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody className="text-center">
                            <h5 className="text-muted mb-2">Late Arrivals</h5>
                            <h3 className="fw-bold text-warning">{attendance.lateDays || 0}</h3>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody className="text-center">
                            <h5 className="text-muted mb-2">Total Days</h5>
                            <h3 className="fw-bold text-primary">{attendance.totalDays || 0}</h3>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Tabs Section */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <MDBCard className="shadow-sm border-0">
                        <MDBTabs pills fill justify className="mb-3">
                            <MDBTabsItem>
                                <MDBTabsLink
                                    onClick={() => setActiveTab('overview')}
                                    active={activeTab === 'overview'}
                                    link
                                >
                                    <MDBIcon fas icon="home" className="me-2" />
                                    Overview
                                </MDBTabsLink>
                            </MDBTabsItem>
                            <MDBTabsItem>
                                <MDBTabsLink
                                    onClick={() => setActiveTab('leaves')}
                                    active={activeTab === 'leaves'}
                                    link
                                >
                                    <MDBIcon fas icon="calendar" className="me-2" />
                                    Leave Balance
                                </MDBTabsLink>
                            </MDBTabsItem>
                            <MDBTabsItem>
                                <MDBTabsLink
                                    onClick={() => setActiveTab('payslip')}
                                    active={activeTab === 'payslip'}
                                    link
                                >
                                    <MDBIcon fas icon="file-invoice-dollar" className="me-2" />
                                    Payslip
                                </MDBTabsLink>
                            </MDBTabsItem>
                            <MDBTabsItem>
                                <MDBTabsLink
                                    onClick={() => setActiveTab('performance')}
                                    active={activeTab === 'performance'}
                                    link
                                >
                                    <MDBIcon fas icon="chart-pie" className="me-2" />
                                    Performance
                                </MDBTabsLink>
                            </MDBTabsItem>
                        </MDBTabs>

                        <MDBTabsContent>
                            {/* Overview Tab */}
                            <MDBTabsPane show={activeTab === 'overview'}>
                                <MDBCardBody>
                                    <h5 className="fw-bold mb-4">Salary Information</h5>
                                    <MDBRow>
                                        <MDBCol md="6" className="mb-3">
                                            <p className="text-muted mb-2">Monthly Salary</p>
                                            <h4 className="fw-bold text-primary">₹{employee.salary?.toLocaleString() || 'N/A'}</h4>
                                        </MDBCol>
                                        <MDBCol md="6" className="mb-3">
                                            <p className="text-muted mb-2">Joining Date</p>
                                            <h5 className="fw-bold">{new Date(employee.joinDate).toLocaleDateString()}</h5>
                                        </MDBCol>
                                    </MDBRow>

                                    <hr className="my-4" />

                                    <h5 className="fw-bold mb-4">Manager Information</h5>
                                    <p className="mb-2">
                                        <strong>Reporting Manager:</strong>{' '}
                                        {employee.reportingManager?.firstName}{' '}
                                        {employee.reportingManager?.lastName || 'Not Assigned'}
                                    </p>
                                </MDBCardBody>
                            </MDBTabsPane>

                            {/* Leave Balance Tab */}
                            <MDBTabsPane show={activeTab === 'leaves'}>
                                <MDBCardBody>
                                    <h5 className="fw-bold mb-4">Leave Balance</h5>
                                    <MDBRow>
                                        <MDBCol md="4" className="mb-3">
                                            <MDBCard className="shadow-sm border-0" style={{ borderLeft: '5px solid #198754' }}>
                                                <MDBCardBody className="text-center">
                                                    <h6 className="text-muted mb-2">Paid Leave</h6>
                                                    <h3 className="fw-bold text-success">{leaveBalance.paid || 0}</h3>
                                                    <small className="text-muted">days remaining</small>
                                                </MDBCardBody>
                                            </MDBCard>
                                        </MDBCol>

                                        <MDBCol md="4" className="mb-3">
                                            <MDBCard className="shadow-sm border-0" style={{ borderLeft: '5px solid #fd7e14' }}>
                                                <MDBCardBody className="text-center">
                                                    <h6 className="text-muted mb-2">Sick Leave</h6>
                                                    <h3 className="fw-bold text-warning">{leaveBalance.sick || 0}</h3>
                                                    <small className="text-muted">days remaining</small>
                                                </MDBCardBody>
                                            </MDBCard>
                                        </MDBCol>

                                        <MDBCol md="4" className="mb-3">
                                            <MDBCard className="shadow-sm border-0" style={{ borderLeft: '5px solid #0d6efd' }}>
                                                <MDBCardBody className="text-center">
                                                    <h6 className="text-muted mb-2">Casual Leave</h6>
                                                    <h3 className="fw-bold text-primary">{leaveBalance.casual || 0}</h3>
                                                    <small className="text-muted">days remaining</small>
                                                </MDBCardBody>
                                            </MDBCard>
                                        </MDBCol>
                                    </MDBRow>

                                    <hr className="my-4" />

                                    <h5 className="fw-bold mb-3">Recent Leave Requests</h5>
                                    {leaveRequests.length === 0 ? (
                                        <p className="text-muted">No leave requests</p>
                                    ) : (
                                        <MDBTable>
                                            <MDBTableHead>
                                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                    <th scope="col">Type</th>
                                                    <th scope="col">From</th>
                                                    <th scope="col">To</th>
                                                    <th scope="col">Days</th>
                                                    <th scope="col">Status</th>
                                                </tr>
                                            </MDBTableHead>
                                            <MDBTableBody>
                                                {leaveRequests.map((leave, idx) => (
                                                    <tr key={idx}>
                                                        <td>{leave.leaveType}</td>
                                                        <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                                                        <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                                                        <td>{leave.numberOfDays}</td>
                                                        <td>
                                                            <MDBBadge
                                                                bg={
                                                                    leave.status === 'approved'
                                                                        ? 'success'
                                                                        : leave.status === 'pending'
                                                                            ? 'warning'
                                                                            : 'danger'
                                                                }
                                                            >
                                                                {leave.status}
                                                            </MDBBadge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </MDBTableBody>
                                        </MDBTable>
                                    )}

                                    <MDBBtn color="primary" className="mt-4">
                                        <MDBIcon fas icon="plus" className="me-2" />
                                        Apply for Leave
                                    </MDBBtn>
                                </MDBCardBody>
                            </MDBTabsPane>

                            {/* Payslip Tab */}
                            <MDBTabsPane show={activeTab === 'payslip'}>
                                <MDBCardBody>
                                    <h5 className="fw-bold mb-4">Latest Payslip</h5>
                                    {Object.keys(latestPayslip).length === 0 ? (
                                        <p className="text-muted">No payslip available</p>
                                    ) : (
                                        <MDBCard className="shadow-sm border-0">
                                            <MDBCardBody>
                                                <MDBRow>
                                                    <MDBCol md="6">
                                                        <p className="text-muted mb-2">Month/Year</p>
                                                        <h5 className="fw-bold mb-4">
                                                            {latestPayslip.month}/{latestPayslip.year}
                                                        </h5>
                                                    </MDBCol>
                                                    <MDBCol md="6">
                                                        <p className="text-muted mb-2">Status</p>
                                                        <h5 className="fw-bold mb-4">
                                                            <MDBBadge
                                                                bg={
                                                                    latestPayslip.paymentStatus === 'paid'
                                                                        ? 'success'
                                                                        : 'warning'
                                                                }
                                                            >
                                                                {latestPayslip.paymentStatus}
                                                            </MDBBadge>
                                                        </h5>
                                                    </MDBCol>
                                                </MDBRow>

                                                <hr />

                                                <h6 className="fw-bold mb-3">Salary Breakdown</h6>
                                                <MDBListGroup flush>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Base Salary</span>
                                                            <strong>₹{latestPayslip.baseSalary?.toLocaleString() || 'N/A'}</strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Gross Salary</span>
                                                            <strong className="text-success">
                                                                ₹{latestPayslip.grossSalary?.toLocaleString() || 'N/A'}
                                                            </strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Deductions</span>
                                                            <strong className="text-danger">
                                                                ₹{(latestPayslip.grossSalary - latestPayslip.netSalary)?.toLocaleString() || 'N/A'}
                                                            </strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span className="fw-bold">Net Salary</span>
                                                            <strong className="text-primary">
                                                                ₹{latestPayslip.netSalary?.toLocaleString() || 'N/A'}
                                                            </strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                </MDBListGroup>
                                            </MDBCardBody>
                                        </MDBCard>
                                    )}
                                </MDBCardBody>
                            </MDBTabsPane>

                            {/* Performance Tab */}
                            <MDBTabsPane show={activeTab === 'performance'}>
                                <MDBCardBody>
                                    <h5 className="fw-bold mb-4">Performance Rating</h5>
                                    {Object.keys(performanceRating).length === 0 ? (
                                        <p className="text-muted">No performance review available</p>
                                    ) : (
                                        <MDBCard className="shadow-sm border-0">
                                            <MDBCardBody>
                                                <div className="text-center mb-4">
                                                    <h2 className="fw-bold text-warning">
                                                        {performanceRating.overallRating || 'N/A'}/5
                                                    </h2>
                                                    <p className="text-muted">Overall Rating</p>
                                                </div>

                                                <hr />

                                                <h6 className="fw-bold mb-3">Performance Metrics</h6>
                                                <MDBListGroup flush>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Productivity</span>
                                                            <strong>
                                                                {performanceRating.performanceMetrics?.productivity || 'N/A'}/5
                                                            </strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Quality</span>
                                                            <strong>
                                                                {performanceRating.performanceMetrics?.quality || 'N/A'}/5
                                                            </strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Communication</span>
                                                            <strong>
                                                                {performanceRating.performanceMetrics?.communication || 'N/A'}/5
                                                            </strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                    <MDBListGroupItem className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Teamwork</span>
                                                            <strong>
                                                                {performanceRating.performanceMetrics?.teamwork || 'N/A'}/5
                                                            </strong>
                                                        </div>
                                                    </MDBListGroupItem>
                                                </MDBListGroup>

                                                <hr className="my-4" />

                                                <h6 className="fw-bold mb-2">Strengths</h6>
                                                <p className="text-muted">
                                                    {performanceRating.strengths?.join(', ') ||
                                                        'No strengths recorded'}
                                                </p>

                                                <h6 className="fw-bold mb-2">Areas for Improvement</h6>
                                                <p className="text-muted">
                                                    {performanceRating.areasForImprovement?.join(', ') ||
                                                        'No areas for improvement recorded'}
                                                </p>
                                            </MDBCardBody>
                                        </MDBCard>
                                    )}
                                </MDBCardBody>
                            </MDBTabsPane>
                        </MDBTabsContent>
                    </MDBCard>
                </MDBCol>
            </MDBRow>
        </div>
    );
};

export default LunaEmployeeDashboard;
