const prisma = require('../Database/prisma')

const utcDay = (value = new Date()) => {
  const date = new Date(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

const employeeForUser = async userId =>
  prisma.employee.findUnique({ where: { accountId: userId }, select: { id: true, departmentId: true } })

const checkIn = async (req, res, next) => {
  try {
    const employee = await employeeForUser(req.user.id)
    if (!employee) return res.status(403).json({ success: false, message: 'Employee profile is not linked to this account.' })
    const date = utcDay()
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } }
    })
    if (existing?.checkInTime) {
      return res.status(409).json({ success: false, message: 'Already checked in today.' })
    }

    const now = new Date()
    const lateAfter = process.env.ATTENDANCE_LATE_AFTER
    const [hour, minute] = /^\d{2}:\d{2}$/.test(lateAfter || '') ? lateAfter.split(':').map(Number) : [null, null]
    const isLate = hour !== null &&
      (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() > minute))
    const record = existing
      ? await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkInTime: now, status: isLate ? 'LATE' : 'PRESENT' }
      })
      : await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date,
          checkInTime: now,
          status: isLate ? 'LATE' : 'PRESENT'
        }
      })
    return res.status(200).json({ success: true, message: 'Check-in recorded successfully', attendance: record })
  } catch (error) {
    return next(error)
  }
}

const checkOut = async (req, res, next) => {
  try {
    const employee = await employeeForUser(req.user.id)
    if (!employee) return res.status(403).json({ success: false, message: 'Employee profile is not linked to this account.' })
    const date = utcDay()
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } }
    })
    if (!existing?.checkInTime) {
      return res.status(404).json({ success: false, message: 'No check-in record found for today.' })
    }
    if (existing.checkOutTime) {
      return res.status(409).json({ success: false, message: 'Already checked out today.' })
    }
    const checkOutTime = new Date()
    const workHours = (checkOutTime.getTime() - existing.checkInTime.getTime()) / 3600000
    if (workHours < 0) return res.status(400).json({ success: false, message: 'Invalid attendance time sequence.' })
    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime,
        workHours: Math.round(workHours * 100) / 100
      }
    })
    return res.status(200).json({ success: true, message: 'Check-out recorded successfully', attendance })
  } catch (error) {
    return next(error)
  }
}

const getAttendanceReport = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.query
    const parsedMonth = Number(month)
    const parsedYear = Number(year)
    if (!employeeId || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 ||
      !Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2200) {
      return res.status(400).json({ success: false, message: 'Valid employeeId, month, and year are required.' })
    }
    const employee = await prisma.employee.findUnique({
      where: { id: String(employeeId) },
      select: { id: true, departmentId: true }
    })
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' })
    const own = req.user.employeeId === employee.id
    const authorized = ['ADMIN', 'HR_MANAGER'].includes(req.user.role) ||
      (req.user.role === 'DEPARTMENT_MANAGER' && req.user.departmentId === employee.departmentId)
    if (!own && !authorized) return res.status(403).json({ success: false, message: 'Insufficient permissions.' })

    const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1))
    const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 1))
    const attendance = await prisma.attendance.findMany({
      where: { employeeId: employee.id, date: { gte: startDate, lt: endDate } },
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
      orderBy: { date: 'asc' }
    })
    const summary = {
      totalPresent: attendance.filter(row => row.status === 'PRESENT').length,
      totalAbsent: attendance.filter(row => row.status === 'ABSENT').length,
      totalLate: attendance.filter(row => row.status === 'LATE').length,
      totalHalfDay: attendance.filter(row => row.status === 'HALF_DAY').length,
      totalOnLeave: attendance.filter(row => row.status === 'ON_LEAVE').length,
      totalWorkHours: attendance.reduce((sum, row) => sum + Number(row.workHours), 0)
    }
    return res.status(200).json({ success: true, attendance, summary })
  } catch (error) {
    return next(error)
  }
}

const getAllAttendance = async (req, res, next) => {
  try {
    const where = req.user.role === 'DEPARTMENT_MANAGER'
      ? { employee: { departmentId: req.user.departmentId } }
      : {}
    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true } },
        approvedBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { date: 'desc' },
      take: 500
    })
    return res.status(200).json({ success: true, attendance })
  } catch (error) {
    return next(error)
  }
}

const approveAttendance = async (req, res, next) => {
  try {
    const { attendanceId } = req.params
    const record = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { employee: { select: { id: true, departmentId: true } } }
    })
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found.' })
    if (req.user.role === 'DEPARTMENT_MANAGER' && req.user.departmentId !== record.employee.departmentId) {
      return res.status(403).json({ success: false, message: 'Cannot approve attendance outside your department.' })
    }
    const approver = req.user.employeeId
    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        approvalStatus: 'APPROVED',
        ...(approver ? { approvedById: approver } : {}),
        ...(typeof req.body.remarks === 'string' ? { remarks: req.body.remarks } : {})
      }
    })
    return res.status(200).json({ success: true, attendance })
  } catch (error) {
    return next(error)
  }
}

module.exports = { checkIn, checkOut, getAttendanceReport, getAllAttendance, approveAttendance }
