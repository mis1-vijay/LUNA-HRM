const prisma = require('../Database/prisma')
const { canManage } = require('./departmentControllers')

const listDesignations = async (req, res, next) => {
  try {
    const departmentId = req.user.role === 'DEPARTMENT_MANAGER'
      ? req.user.departmentId
      : req.query.departmentId
    const designations = await prisma.designation.findMany({
      where: departmentId ? { departmentId } : {},
      include: { department: true },
      orderBy: { designationName: 'asc' }
    })
    return res.status(200).json({ success: true, designations })
  } catch (error) {
    return next(error)
  }
}

const createDesignation = async (req, res, next) => {
  try {
    const { designationName, designationCode, departmentId, description, level, salaryRangeMin, salaryRangeMax } = req.body
    if (![designationName, designationCode, departmentId].every(value =>
      typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Name, code, and department are required.' })
    }
    const designation = await prisma.designation.create({
      data: {
        designationName: designationName.trim(),
        designationCode: designationCode.trim().toUpperCase(),
        departmentId,
        description: description ?? null,
        ...(level ? { level: String(level).toUpperCase() } : {}),
        ...(salaryRangeMin !== undefined ? { salaryRangeMin } : {}),
        ...(salaryRangeMax !== undefined ? { salaryRangeMax } : {})
      },
      include: { department: true }
    })
    return res.status(201).json({ success: true, designation })
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Designation name or code already exists.' })
    return next(error)
  }
}

const updateDesignation = async (req, res, next) => {
  try {
    const { designationName, designationCode, departmentId, description, level, status, salaryRangeMin, salaryRangeMax } = req.body
    const designation = await prisma.designation.update({
      where: { id: req.params.id },
      data: {
        ...(typeof designationName === 'string' ? { designationName: designationName.trim() } : {}),
        ...(typeof designationCode === 'string' ? { designationCode: designationCode.trim().toUpperCase() } : {}),
        ...(departmentId !== undefined ? { departmentId } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(level ? { level: String(level).toUpperCase() } : {}),
        ...(status ? { status: String(status).toUpperCase() } : {}),
        ...(salaryRangeMin !== undefined ? { salaryRangeMin } : {}),
        ...(salaryRangeMax !== undefined ? { salaryRangeMax } : {})
      },
      include: { department: true }
    })
    return res.status(200).json({ success: true, designation })
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Designation name or code already exists.' })
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Designation not found.' })
    return next(error)
  }
}

const deleteDesignation = async (req, res, next) => {
  try {
    await prisma.designation.delete({ where: { id: req.params.id } })
    return res.status(200).json({ success: true, message: 'Designation deleted.' })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Designation not found.' })
    if (error.code === 'P2003') return res.status(409).json({ success: false, message: 'Designation is assigned to employees.' })
    return next(error)
  }
}

module.exports = { listDesignations, createDesignation, updateDesignation, deleteDesignation }
