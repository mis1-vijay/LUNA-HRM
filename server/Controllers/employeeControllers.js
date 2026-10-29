const bcrypt = require('bcrypt')
const prisma = require('../Database/prisma')

const employeeSelect = {
  id: true,
  employeeId: true,
  accountId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  departmentId: true,
  designationId: true,
  reportingManagerId: true,
  joinDate: true,
  employmentType: true,
  addressStreet: true,
  addressCity: true,
  addressState: true,
  addressCountry: true,
  addressZipCode: true,
  emergencyName: true,
  emergencyRelationship: true,
  emergencyPhone: true,
  status: true,
  profileImage: true,
  paidLeaveBalance: true,
  sickLeaveBalance: true,
  casualLeaveBalance: true,
  department: true,
  designation: true,
  reportingManager: { select: { id: true, firstName: true, lastName: true, email: true } }
}

const canViewDepartment = (req, departmentId) =>
  req.user.role === 'ADMIN' ||
  req.user.role === 'HR_MANAGER' ||
  (req.user.role === 'DEPARTMENT_MANAGER' && req.user.departmentId === departmentId)

const employeeForApi = employee => ({
  ...employee,
  _id: employee.id,
  status: employee.status?.toLowerCase(),
  gender: employee.gender?.toLowerCase(),
  employmentType: employee.employmentType?.toLowerCase().replace('_', '')
})
const employmentTypeValue = value => {
  const normalized = String(value || 'PERMANENT').toUpperCase()
  return normalized === 'PARTTIME' ? 'PART_TIME' : normalized
}

const createEmployee = async (req, res, next) => {
  try {
    const data = req.body
    const required = ['employeeId', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'gender', 'departmentId', 'designationId', 'joinDate', 'salary']
    if (required.some(key => data[key] === undefined || data[key] === '')) {
      return res.status(400).json({ success: false, message: 'Required employee fields are missing.' })
    }
    if (req.user.role === 'DEPARTMENT_MANAGER' && req.user.departmentId !== data.departmentId) {
      return res.status(403).json({ success: false, message: 'Cannot create employees outside your department.' })
    }

    let account = undefined
    if (data.password) {
      if (typeof data.password !== 'string' || data.password.length < 8) {
        return res.status(400).json({ success: false, message: 'Employee password must be at least 8 characters.' })
      }
      account = {
        create: {
          email: data.email.trim().toLowerCase(),
          name: `${data.firstName.trim()} ${data.lastName.trim()}`,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          passwordHash: await bcrypt.hash(data.password, 12),
          role: 'EMPLOYEE'
        }
      }
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId: data.employeeId.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: String(data.phone),
        dateOfBirth: new Date(data.dateOfBirth),
        gender: String(data.gender).toUpperCase(),
        departmentId: data.departmentId,
        designationId: data.designationId,
        reportingManagerId: data.reportingManagerId || null,
        joinDate: new Date(data.joinDate),
        employmentType: employmentTypeValue(data.employmentType),
        addressStreet: data.address?.street ?? null,
        addressCity: data.address?.city ?? null,
        addressState: data.address?.state ?? null,
        addressCountry: data.address?.country ?? null,
        addressZipCode: data.address?.zipCode ?? null,
        emergencyName: data.emergencyContact?.name ?? null,
        emergencyRelationship: data.emergencyContact?.relationship ?? null,
        emergencyPhone: data.emergencyContact?.phone ?? null,
        bankAccountNumber: data.bankDetails?.accountNumber ?? null,
        bankName: data.bankDetails?.bankName ?? null,
        bankIfscCode: data.bankDetails?.ifscCode ?? null,
        bankAccountHolder: data.bankDetails?.accountHolder ?? null,
        salary: data.salary,
        ...(account ? { account } : {})
      },
      select: { ...employeeSelect, salary: true }
    })
    return res.status(201).json({ success: true, message: 'Employee created successfully', employee: employeeForApi(employee) })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Employee ID or email already exists.' })
    }
    return next(error)
  }
}

const getAllEmployees = async (req, res, next) => {
  try {
    const where = req.user.role === 'DEPARTMENT_MANAGER'
      ? { departmentId: req.user.departmentId }
      : {}
    const employees = await prisma.employee.findMany({
      where,
      select: req.user.role === 'ADMIN' || req.user.role === 'HR_MANAGER'
        ? { ...employeeSelect, salary: true }
        : employeeSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    })
    return res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      employees: employees.map(employeeForApi)
    })
  } catch (error) {
    return next(error)
  }
}

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: ['ADMIN', 'HR_MANAGER'].includes(req.user.role)
        ? { ...employeeSelect, salary: true }
        : employeeSelect
    })
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' })

    const isSelf = req.user.employeeId === employee.id
    if (!isSelf && !canViewDepartment(req, employee.departmentId)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' })
    }
    return res.status(200).json({
      success: true,
      message: 'Employee retrieved successfully',
      employee: employeeForApi(employee)
    })
  } catch (error) {
    return next(error)
  }
}

const updateEmployee = async (req, res, next) => {
  try {
    const existing = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: { id: true, departmentId: true }
    })
    if (!existing) return res.status(404).json({ success: false, message: 'Employee not found.' })
    if (!canViewDepartment(req, existing.departmentId)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' })
    }
    const body = req.body
    const scalarFields = [
      'employeeId', 'firstName', 'lastName', 'email', 'phone', 'departmentId',
      'designationId', 'reportingManagerId', 'salary', 'profileImage'
    ]
    const data = {}
    for (const field of scalarFields) {
      if (Object.hasOwn(body, field)) data[field] = body[field]
    }
    for (const [field, key] of [['dateOfBirth', 'dateOfBirth'], ['joinDate', 'joinDate']]) {
      if (Object.hasOwn(body, key)) data[field] = new Date(body[key])
    }
    for (const field of ['gender', 'employmentType', 'status']) {
      if (Object.hasOwn(body, field)) {
        data[field] = field === 'employmentType'
          ? employmentTypeValue(body[field])
          : String(body[field]).toUpperCase()
      }
    }
    const nested = {
      street: ['addressStreet', body.address?.street],
      city: ['addressCity', body.address?.city],
      state: ['addressState', body.address?.state],
      country: ['addressCountry', body.address?.country],
      zipCode: ['addressZipCode', body.address?.zipCode]
    }
    for (const [key, [field, value]] of Object.entries(nested)) {
      if (body.address && Object.hasOwn(body.address, key)) data[field] = value
    }
    const employee = await prisma.employee.update({
      where: { id: existing.id },
      data,
      select: { ...employeeSelect, salary: true }
    })
    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: employeeForApi(employee)
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Employee ID or email already exists.' })
    }
    return next(error)
  }
}

const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: { status: 'TERMINATED' },
      select: req.user.role === 'ADMIN' || req.user.role === 'HR_MANAGER'
        ? { ...employeeSelect, salary: true }
        : employeeSelect,
    })
    return res.status(200).json({
      success: true,
      message: 'Employee terminated successfully',
      employee: employeeForApi(employee)
    })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Employee not found.' })
    return next(error)
  }
}

const getEmployeesByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params
    if (!canViewDepartment(req, departmentId)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' })
    }
    const employees = await prisma.employee.findMany({
      where: { departmentId, status: 'ACTIVE' },
      select: employeeSelect,
      orderBy: { lastName: 'asc' }
    })
    return res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      employees: employees.map(employeeForApi)
    })
  } catch (error) {
    return next(error)
  }
}

const getDepartmentStats = async (req, res, next) => {
  try {
    const grouped = await prisma.employee.groupBy({
      by: ['departmentId'],
      _count: { _all: true },
      _avg: { salary: true }
    })
    const departments = await prisma.department.findMany({
      where: { id: { in: grouped.map(row => row.departmentId) } },
      select: { id: true, departmentName: true }
    })
    const nameById = new Map(departments.map(department => [department.id, department.departmentName]))
    const stats = grouped.map(row => ({
      _id: row.departmentId,
      count: row._count._all,
      avgSalary: row._avg.salary,
      deptInfo: [{ departmentName: nameById.get(row.departmentId) }]
    }))
    return res.status(200).json({ success: true, message: 'Department statistics retrieved successfully', stats })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  getDepartmentStats
}
