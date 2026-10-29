const prisma = require('../Database/prisma')

const employeeProfile = userId =>
  prisma.employee.findUnique({ where: { accountId: userId }, select: { id: true, departmentId: true } })

const canReview = (user, leave) =>
  ['ADMIN', 'HR_MANAGER'].includes(user.role) ||
  (user.role === 'DEPARTMENT_MANAGER' && user.departmentId === leave.employee.departmentId)

const applyLeave = async (req, res, next) => {
  try {
    const employee = await employeeProfile(req.user.id)
    if (!employee) return res.status(403).json({ success: false, message: 'Employee profile is not linked to this account.' })
    const { leaveType, startDate, endDate, reason, isEmergency } = req.body
    const validTypes = ['PAID_LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE', 'UNPAID_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE']
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (!validTypes.includes(leaveType) || !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) || end < start ||
      typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Valid leave type, dates, and reason are required.' })
    }
    const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
    const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
    const days = Math.floor((endDay - startDay) / 86400000) + 1
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType,
        startDate: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())),
        endDate: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())),
        numberOfDays: days,
        reason: reason.trim(),
        isEmergency: Boolean(isEmergency)
      }
    })
    return res.status(201).json({ success: true, leave })
  } catch (error) {
    return next(error)
  }
}

const listLeaves = async (req, res, next) => {
  try {
    const where = req.user.role === 'EMPLOYEE'
      ? { employee: { accountId: req.user.id } }
      : req.user.role === 'DEPARTMENT_MANAGER'
        ? { employee: { departmentId: req.user.departmentId } }
        : {}
    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, employeeId: true, firstName: true, lastName: true, departmentId: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    })
    return res.status(200).json({ success: true, leaves })
  } catch (error) {
    return next(error)
  }
}

const reviewLeave = async (req, res, next) => {
  try {
    const { id } = req.params
    const decision = String(req.body.status || '').toUpperCase()
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected.' })
    }
    const result = await prisma.$transaction(async tx => {
      const leave = await tx.leaveRequest.findUnique({
        where: { id },
        include: { employee: { select: { id: true, departmentId: true } } }
      })
      if (!leave) return { error: 'NOT_FOUND' }
      if (!canReview(req.user, leave)) return { error: 'FORBIDDEN' }
      if (leave.status !== 'PENDING') return { error: 'ALREADY_REVIEWED' }

      const approvalFields = {
        status: decision,
        approvalDate: new Date(),
        approvalRemarks: typeof req.body.approvalRemarks === 'string' ? req.body.approvalRemarks : null,
        ...(req.user.employeeId ? { approvedById: req.user.employeeId } : {})
      }
      const claimed = await tx.leaveRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: approvalFields
      })
      if (claimed.count !== 1) return { error: 'ALREADY_REVIEWED' }

      if (decision === 'APPROVED') {
        const balanceField = {
          PAID_LEAVE: 'paidLeaveBalance',
          SICK_LEAVE: 'sickLeaveBalance',
          CASUAL_LEAVE: 'casualLeaveBalance'
        }[leave.leaveType]
        if (balanceField) {
          const updated = await tx.employee.updateMany({
            where: { id: leave.employeeId, [balanceField]: { gte: leave.numberOfDays } },
            data: { [balanceField]: { decrement: leave.numberOfDays } }
          })
          if (updated.count !== 1) {
            const insufficient = new Error('Insufficient leave balance.')
            insufficient.code = 'LEAVE_BALANCE_INSUFFICIENT'
            throw insufficient
          }
        }
      }
      return { leave: { ...leave, ...approvalFields } }
    })

    if (result.error === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Leave request not found.' })
    if (result.error === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Cannot review leave outside your permission scope.' })
    if (result.error === 'ALREADY_REVIEWED') return res.status(409).json({ success: false, message: 'Leave request is no longer pending.' })
    if (result.error === 'INSUFFICIENT_BALANCE') return res.status(409).json({ success: false, message: 'Insufficient leave balance.' })
    return res.status(200).json({ success: true, leave: result.leave })
  } catch (error) {
    if (error.code === 'LEAVE_BALANCE_INSUFFICIENT') {
      return res.status(409).json({ success: false, message: error.message })
    }
    return next(error)
  }
}

const getLeaveBalances = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { accountId: req.user.id },
      select: {
        id: true,
        paidLeaveBalance: true,
        sickLeaveBalance: true,
        casualLeaveBalance: true
      }
    })
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' })
    return res.status(200).json({
      success: true,
      leaveBalance: {
        paid: employee.paidLeaveBalance,
        sick: employee.sickLeaveBalance,
        casual: employee.casualLeaveBalance
      }
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = { applyLeave, listLeaves, reviewLeave, getLeaveBalances }
