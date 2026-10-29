const prisma = require('../Database/prisma')

const canManage = role => role === 'ADMIN' || role === 'HR_MANAGER'

const listDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: req.user.role === 'DEPARTMENT_MANAGER'
        ? { id: req.user.departmentId }
        : {},
      include: { _count: { select: { employees: true, designations: true } } },
      orderBy: { departmentName: 'asc' }
    })
    return res.status(200).json({ success: true, departments })
  } catch (error) {
    return next(error)
  }
}

const createDepartment = async (req, res, next) => {
  try {
    const { departmentName, departmentCode, description, budget } = req.body
    if (![departmentName, departmentCode].every(value =>
      typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Department name and code are required.' })
    }
    const department = await prisma.department.create({
      data: {
        departmentName: departmentName.trim(),
        departmentCode: departmentCode.trim().toUpperCase(),
        description: description ?? null,
        ...(budget !== undefined ? { budget } : {})
      }
    })
    return res.status(201).json({ success: true, department })
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Department name or code already exists.' })
    return next(error)
  }
}

const updateDepartment = async (req, res, next) => {
  try {
    const { departmentName, departmentCode, description, budget, status, managerAccountId } = req.body
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...(typeof departmentName === 'string' ? { departmentName: departmentName.trim() } : {}),
        ...(typeof departmentCode === 'string' ? { departmentCode: departmentCode.trim().toUpperCase() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(budget !== undefined ? { budget } : {}),
        ...(status !== undefined ? { status: String(status).toUpperCase() } : {}),
        ...(managerAccountId !== undefined ? { managerAccountId: managerAccountId || null } : {})
      }
    })
    return res.status(200).json({ success: true, department })
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Department name or code already exists.' })
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Department not found.' })
    return next(error)
  }
}

const deleteDepartment = async (req, res, next) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } })
    return res.status(200).json({ success: true, message: 'Department deleted.' })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Department not found.' })
    if (error.code === 'P2003') return res.status(409).json({ success: false, message: 'Department is referenced by other records.' })
    return next(error)
  }
}

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment, canManage }
