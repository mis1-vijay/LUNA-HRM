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
    MDBSpinner
} from 'mdb-react-ui-kit';
import Chart from 'react-apexcharts';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL, readStoredToken } from '../../../API/apiClient';

const LunaAdminDashboard = () => {
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
                `${API_BASE_URL}/dashboard/admin`,
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
            toast.error('Failed to load dashboard data');
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

    const summary = dashboardData?.summary || {};
    const departmentStats = dashboardData?.departmentStats || [];
    const attendanceTrend = dashboardData?.attendanceTrend || [];

    // Chart data for department statistics
    const deptChartOptions = {
        chart: {
            type: 'bar',
            height: 350
        },
        colors: ['#0d6efd', '#198754'],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%'
            }
        },
        xaxis: {
            categories: departmentStats.map(d => d.deptInfo?.[0]?.departmentName || 'Unknown')
        },
        yaxis: {
            title: { text: 'Count' }
        }
    };

    const deptChartSeries = [
        {
            name: 'Employees',
            data: departmentStats.map(d => d.count)
        },
        {
            name: 'Avg Salary',
            data: departmentStats.map(d => Math.round(d.avgSalary / 1000))
        }
    ];

    // Attendance trend chart
    const attendanceChartOptions = {
        chart: {
            type: 'area',
            height: 350
        },
        colors: ['#0d6efd', '#dc3545', '#fd7e14'],
        xaxis: {
            categories: attendanceTrend.map(a => a._id)
        },
        yaxis: {
            title: { text: 'Number of Employees' }
        },
        stroke: {
            curve: 'smooth'
        }
    };

    const attendanceChartSeries = [
        {
            name: 'Present',
            data: attendanceTrend.map(a => a.present || 0)
        },
        {
            name: 'Absent',
            data: attendanceTrend.map(a => a.absent || 0)
        },
        {
            name: 'Late',
            data: attendanceTrend.map(a => a.late || 0)
        }
    ];

    const payrollSummary = dashboardData?.payrollSummary || {};

    return (
        <div className="luna-admin-dashboard p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <h2 className="fw-bold" style={{ color: '#0d6efd' }}>
                        <MDBIcon fas icon="moon" className="me-2" />
                        Luna HRM - Admin Dashboard
                    </h2>
                    <p className="text-muted">System Overview & Analytics</p>
                </MDBCol>
                <MDBCol className="text-end">
                    <MDBBtn color="primary" outline onClick={fetchDashboardData}>
                        <MDBIcon fas icon="sync" className="me-2" />
                        Refresh
                    </MDBBtn>
                </MDBCol>
            </MDBRow>

            {/* Summary Cards */}
            <MDBRow className="mb-4">
                <MDBCol md="3" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Active Employees</h6>
                                    <h3 className="fw-bold">{summary.totalEmployees}</h3>
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
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Present Today</h6>
                                    <h3 className="fw-bold">{summary.presentToday}</h3>
                                    <small className="text-success">
                                        {summary.presentPercentage}% attendance rate
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
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Pending Leaves</h6>
                                    <h3 className="fw-bold">{summary.pendingLeaves}</h3>
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
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted mb-2">Departments</h6>
                                    <h3 className="fw-bold">{summary.totalDepartments}</h3>
                                </div>
                                <MDBIcon
                                    fas
                                    icon="building"
                                    size="3x"
                                    style={{ color: '#6c757d', opacity: 0.5 }}
                                />
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Charts */}
            <MDBRow className="mb-4">
                <MDBCol lg="6" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">Department Analytics</h5>
                            <Chart
                                options={deptChartOptions}
                                series={deptChartSeries}
                                type="bar"
                                height={350}
                            />
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>

                <MDBCol lg="6" className="mb-3">
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">Attendance Trend (7 Days)</h5>
                            <Chart
                                options={attendanceChartOptions}
                                series={attendanceChartSeries}
                                type="area"
                                height={350}
                            />
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Payroll Summary */}
            <MDBRow className="mb-4">
                <MDBCol>
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">
                                <MDBIcon fas icon="money-bill-wave" className="me-2" />
                                Payroll Summary - Current Month
                            </h5>
                            <MDBTable>
                                <MDBTableHead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th scope="col">Total Gross</th>
                                        <th scope="col">Total Deductions</th>
                                        <th scope="col">Total Net Salary</th>
                                        <th scope="col">Processed</th>
                                        <th scope="col">Pending</th>
                                    </tr>
                                </MDBTableHead>
                                <MDBTableBody>
                                    <tr>
                                        <td>
                                            <strong>₹{(payrollSummary.totalGross || 0).toLocaleString()}</strong>
                                        </td>
                                        <td>
                                            <strong>₹{(payrollSummary.totalDeductions || 0).toLocaleString()}</strong>
                                        </td>
                                        <td>
                                            <strong>₹{(payrollSummary.totalNet || 0).toLocaleString()}</strong>
                                        </td>
                                        <td>
                                            <MDBBadge bg="success">
                                                {payrollSummary.processedCount || 0}
                                            </MDBBadge>
                                        </td>
                                        <td>
                                            <MDBBadge bg="warning">
                                                {payrollSummary.pendingCount || 0}
                                            </MDBBadge>
                                        </td>
                                    </tr>
                                </MDBTableBody>
                            </MDBTable>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>

            {/* Pending Approvals */}
            <MDBRow>
                <MDBCol>
                    <MDBCard className="shadow-sm border-0">
                        <MDBCardBody>
                            <h5 className="fw-bold mb-4">
                                <MDBIcon fas icon="hourglass-half" className="me-2" />
                                Pending Approvals
                            </h5>
                            <p className="text-muted">
                                {summary.pendingApprovalsCount} items pending your approval
                            </p>
                            <MDBBtn
                                color="primary"
                                size="sm"
                                onClick={() => window.location.href = '/admin-dashboard/attendance'}
                            >
                                View Pending Attendance
                                <MDBIcon fas icon="arrow-right" className="ms-2" />
                            </MDBBtn>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>
        </div>
    );
};

export default LunaAdminDashboard;
