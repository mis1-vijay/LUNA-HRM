const prisma = require('../Database/prisma')

const canViewPayroll = (user, employee) =>
  ['ADMIN', 'HR_MANAGER'].includes(user.role) ||
  user.employeeId === employee.id

const createSalary = async (req, res, next) => {
  try {
    const body = req.body
    const employeeId = body.employeeId
    const requiredNumbers = ['baseSalary', 'grossSalary', 'netSalary']
    const decimalFields = [
      ...requiredNumbers, 'dearnessAllowance', 'houseRentAllowance', 'medicalAllowance',
      'conveyanceAllowance', 'otherAllowance', 'providentFund', 'incomeTax',
      'professionalTax', 'otherDeductions', 'attendanceDays', 'overtimeHours', 'overtimeAmount'
    ]
    const month = Number(body.month)
    const year = Number(body.year)
    if (!employeeId || !Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(year) || year < 2000 || year > 2200 ||
      requiredNumbers.some(key => body[key] === undefined || !Number.isFinite(Number(body[key])) || Number(body[key]) < 0) ||
      decimalFields.some(key => body[key] !== undefined && (!Number.isFinite(Number(body[key])) || Number(body[key]) < 0))) {
      return res.status(400).json({
        success: false,
        message: 'Employee, month, year, and non-negative base/gross/net amounts are required.'
      })
    }
    const salary = await prisma.salary.create({
      data: {
        employeeId,
        month: String(month),
        year,
        baseSalary: body.baseSalary,
        grossSalary: body.grossSalary,
        netSalary: body.netSalary,
        dearnessAllowance: body.dearnessAllowance ?? 0,
        houseRentAllowance: body.houseRentAllowance ?? 0,
        medicalAllowance: body.medicalAllowance ?? 0,
        conveyanceAllowance: body.conveyanceAllowance ?? 0,
        otherAllowance: body.otherAllowance ?? 0,
        providentFund: body.providentFund ?? 0,
        incomeTax: body.incomeTax ?? 0,
        professionalTax: body.professionalTax ?? 0,
        otherDeductions: body.otherDeductions ?? 0,
        attendanceDays: body.attendanceDays ?? 0,
        overtimeHours: body.overtimeHours ?? 0,
        overtimeAmount: body.overtimeAmount ?? 0,
        paymentMethod: body.paymentMethod ? String(body.paymentMethod).toUpperCase() : 'BANK_TRANSFER',
        paymentStatus: body.paymentStatus ? String(body.paymentStatus).toUpperCase() : 'PENDING',
        remarks: body.remarks ?? null
      }
    })
    return res.status(201).json({ success: true, salary })
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Payroll record already exists for this employee and period.' })
    if (error.code === 'P2003') return res.status(404).json({ success: false, message: 'Employee not found.' })
    return next(error)
  }
}

const listSalaries = async (req, res, next) => {
  try {
    const where = req.user.role === 'EMPLOYEE'
      ? { employee: { accountId: req.user.id } }
      : {
        ...(req.query.employeeId ? { employeeId: String(req.query.employeeId) } : {}),
        ...(req.query.year ? { year: Number(req.query.year) } : {}),
        ...(req.query.month ? { month: String(req.query.month) } : {})
      }
    const salaries = await prisma.salary.findMany({
      where,
      include: { employee: { select: { id: true, employeeId: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    })
    return res.status(200).json({ success: true, salaries })
  } catch (error) {
    return next(error)
  }
}

const getSalary = async (req, res, next) => {
  try {
    const salary = await prisma.salary.findUnique({
      where: { id: req.params.id },
      include: { employee: { select: { id: true, employeeId: true, firstName: true, lastName: true } } }
    })
    if (!salary) return res.status(404).json({ success: false, message: 'Payroll record not found.' })
    if (!canViewPayroll(req.user, salary.employee)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' })
    }
    return res.status(200).json({ success: true, salary })
  } catch (error) {
    return next(error)
  }
}

const updatePaymentStatus = async (req, res, next) => {
  try {
    const paymentStatus = String(req.body.paymentStatus || '').toUpperCase()
    const valid = ['PENDING', 'PROCESSED', 'PAID', 'FAILED']
    if (!valid.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status.' })
    }
    const salary = await prisma.salary.update({
      where: { id: req.params.id },
      data: {
        paymentStatus,
        ...(paymentStatus === 'PAID' ? { paymentDate: new Date() } : {})
      }
    })
    return res.status(200).json({ success: true, salary })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Payroll record not found.' })
    return next(error)
  }
}

module.exports = { createSalary, listSalaries, getSalary, updatePaymentStatus }
