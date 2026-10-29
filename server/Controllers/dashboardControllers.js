const prisma = require('../Database/prisma')

const dateRangeToday = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { gte: start, lt: end }
}

const getAdminDashboard = async (req, res, next) => {
  try {
    const todayRange = dateRangeToday()
    const [totalEmployees, totalDepartments, todayAttendance, presentToday,
      pendingLeaves, pendingApprovalsCount, departmentRows, attendanceRows, payrollRows] =
      await Promise.all([
        prisma.employee.count({ where: { status: 'ACTIVE' } }),
        prisma.department.count({ where: { status: 'ACTIVE' } }),
        prisma.attendance.count({ where: { date: todayRange } }),
        prisma.attendance.count({ where: { date: todayRange, status: 'PRESENT' } }),
        prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
        prisma.attendance.count({ where: { approvalStatus: 'PENDING' } }),
        prisma.employee.groupBy({
          by: ['departmentId'],
          where: { status: 'ACTIVE' },
          _count: { _all: true },
          _avg: { salary: true }
        }),
        prisma.attendance.findMany({
          where: { date: { gte: new Date(Date.now() - 7 * 86400000) } },
          select: { date: true, status: true }
        }),
        prisma.salary.findMany({
          where: { month: String(new Date().getMonth() + 1), year: new Date().getFullYear() },
          select: { grossSalary: true, netSalary: true, paymentStatus: true }
        })
      ])

    const departments = await prisma.department.findMany({
      where: { id: { in: departmentRows.map(row => row.departmentId) } },
      select: { id: true, departmentName: true }
    })
    const departmentNames = new Map(departments.map(row => [row.id, row.departmentName]))
    const departmentStats = departmentRows.map(row => ({
      _id: row.departmentId,
      count: row._count._all,
      avgSalary: Number(row._avg.salary ?? 0),
      deptInfo: [{ departmentName: departmentNames.get(row.departmentId) ?? 'Unknown' }]
    }))
    const attendanceByDay = new Map()
    for (const row of attendanceRows) {
      const key = row.date.toISOString().slice(0, 10)
      const summary = attendanceByDay.get(key) || { _id: key, present: 0, absent: 0, late: 0 }
      if (row.status === 'PRESENT') summary.present++
      if (row.status === 'ABSENT') summary.absent++
      if (row.status === 'LATE') summary.late++
      attendanceByDay.set(key, summary)
    }
    const payrollSummary = payrollRows.reduce((summary, row) => {
      summary.totalGross += Number(row.grossSalary)
      summary.totalNet += Number(row.netSalary)
      summary.totalDeductions += Number(row.grossSalary) - Number(row.netSalary)
      if (row.paymentStatus === 'PAID') summary.processedCount++
      if (row.paymentStatus === 'PENDING') summary.pendingCount++
      return summary
    }, { totalGross: 0, totalNet: 0, totalDeductions: 0, processedCount: 0, pendingCount: 0 })

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          totalDepartments,
          todayAttendance,
          presentToday,
          presentPercentage: todayAttendance ? Math.round((presentToday / todayAttendance) * 100) : 0,
          pendingLeaves,
          pendingApprovalsCount
        },
        departmentStats,
        payrollSummary,
        attendanceTrend: Array.from(attendanceByDay.values()).sort((a, b) => a._id.localeCompare(b._id))
      }
    })
  } catch (error) {
    return next(error)
  }
}

const getHRDashboard = async (req, res, next) => {
  try {
    const today = dateRangeToday()
    const [pendingApplications, hiresToday, leaveGroups, attendanceGroups, leaveTypeGroups,
      pendingLeaves, pendingAttendances] = await Promise.all([
      prisma.jobApplication.count({ where: { applicationStatus: 'PENDING' } }),
      prisma.employee.count({ where: { createdAt: today } }),
      prisma.leaveRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.attendance.groupBy({ by: ['approvalStatus'], _count: { _all: true } }),
      prisma.leaveRequest.groupBy({ by: ['leaveType'], _count: { _all: true } }),
      prisma.leaveRequest.findMany({
        where: { status: 'PENDING' },
        include: { employee: { select: { id: true, employeeId: true, firstName: true, lastName: true, departmentId: true } } },
        orderBy: { createdAt: 'asc' },
        take: 10
      }),
      prisma.attendance.findMany({
        where: { approvalStatus: 'PENDING' },
        include: { employee: { select: { id: true, employeeId: true, firstName: true, lastName: true, departmentId: true } } },
        orderBy: { date: 'desc' },
        take: 10
      })
    ])
    return res.status(200).json({
      success: true,
      data: {
        recruitment: { pendingApplications, hiresToday },
        leaveStats: leaveGroups.map(row => ({ _id: row.status.toLowerCase(), count: row._count._all })),
        leaveByType: leaveTypeGroups.map(row => ({ _id: row.leaveType.toLowerCase(), count: row._count._all })),
        attendanceApprovalStats: attendanceGroups.map(row => ({ _id: row.approvalStatus.toLowerCase(), count: row._count._all })),
        pendingLeaves,
        pendingAttendances
      }
    })
  } catch (error) {
    return next(error)
  }
}

const getManagerDashboard = async (req, res, next) => {
  try {
    const departmentId = req.user.departmentId
    if (!departmentId) return res.status(400).json({ success: false, message: 'Manager is not assigned to a department.' })
    const todayRange = dateRangeToday()
    const [department, teamSize, teamMembers, attendanceRows, teamLeaves, pendingReviews] =
      await Promise.all([
        prisma.department.findUnique({ where: { id: departmentId } }),
        prisma.employee.count({ where: { departmentId, status: 'ACTIVE' } }),
        prisma.employee.findMany({
          where: { departmentId, status: 'ACTIVE' },
          select: {
            id: true, firstName: true, lastName: true, email: true, status: true,
            designation: { select: { designationName: true } }
          },
          orderBy: { lastName: 'asc' }
        }),
        prisma.attendance.groupBy({
          by: ['status'],
          where: { employee: { departmentId }, date: todayRange },
          _count: { _all: true }
        }),
        prisma.leaveRequest.findMany({
          where: { status: 'PENDING', employee: { departmentId } },
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
          orderBy: { createdAt: 'asc' }
        }),
        prisma.performance.count({
          where: { reviewedBy: { accountId: req.user.id }, status: 'DRAFT' }
        })
      ])
    if (!department) return res.status(404).json({ success: false, message: 'Department not found.' })
    return res.status(200).json({
      success: true,
      data: {
        department,
        teamSize,
        teamMembers,
        teamAttendance: attendanceRows.map(row => ({ _id: row.status.toLowerCase(), count: row._count._all })),
        teamLeaves,
        pendingReviews
      }
    })
  } catch (error) {
    return next(error)
  }
}

const getEmployeeDashboard = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId
    if (!employeeId) return res.status(403).json({ success: false, message: 'Employee profile is not linked to this account.' })
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        designation: true,
        reportingManager: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    })
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' })
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const [monthAttendance, latestPayslip, leaveRequests, performanceRating] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId, date: { gte: start, lt: end } },
        select: { status: true }
      }),
      prisma.salary.findFirst({ where: { employeeId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] }),
      prisma.leaveRequest.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.performance.findFirst({ where: { employeeId }, orderBy: { createdAt: 'desc' } })
    ])
    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          _id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          profileImage: employee.profileImage,
          department: employee.department,
          designation: employee.designation,
          reportingManager: employee.reportingManager,
          joinDate: employee.joinDate,
          salary: employee.salary
        },
        attendance: {
          presentDays: monthAttendance.filter(row => row.status === 'PRESENT').length,
          absentDays: monthAttendance.filter(row => row.status === 'ABSENT').length,
          lateDays: monthAttendance.filter(row => row.status === 'LATE').length,
          totalDays: monthAttendance.length
        },
        leaveBalance: {
          paid: employee.paidLeaveBalance,
          sick: employee.sickLeaveBalance,
          casual: employee.casualLeaveBalance
        },
        latestPayslip,
        leaveRequests,
        performanceRating: performanceRating
          ? {
            ...performanceRating,
            performanceMetrics: {
              productivity: performanceRating.productivity,
              quality: performanceRating.quality,
              communication: performanceRating.communication,
              teamwork: performanceRating.teamwork,
              reliability: performanceRating.reliability,
              innovation: performanceRating.innovation
            }
          }
          : null
      }
    })
  } catch (error) {
    return next(error)
  }
}

const getQuickStats = async (req, res, next) => {
  try {
    const [activeEmployees, presentToday, onLeave, departments] = await Promise.all([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.count({ where: { date: dateRangeToday(), status: 'PRESENT' } }),
      prisma.leaveRequest.count({ where: { status: 'APPROVED', startDate: { lte: new Date() }, endDate: { gte: new Date() } } }),
      prisma.department.count({ where: { status: 'ACTIVE' } })
    ])
    return res.status(200).json({
      success: true,
      data: { activeEmployees, presentToday, onLeave, departments }
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getAdminDashboard,
  getHRDashboard,
  getManagerDashboard,
  getEmployeeDashboard,
  getQuickStats
}
