const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../Database/prisma')

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000
}

const safeAccount = ({ id, email, name, firstName, lastName, role, status, departmentId }) => ({
  id, _id: id, email, name, firstName, lastName, role, status, departmentId
})

const adminRegister = async (req, res, next) => {
  try {
    const bootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY
    if (!bootstrapKey || req.get('x-admin-bootstrap-key') !== bootstrapKey) {
      return res.status(403).json({ success: false, message: 'Admin bootstrap is not authorized.' })
    }

    const adminExists = await prisma.account.count({ where: { role: 'ADMIN' } })
    if (adminExists) {
      return res.status(403).json({ success: false, message: 'Admin bootstrap is closed.' })
    }
    const { email, name, password } = req.body
    if (![email, name, password].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Email, name, and password are required.' })
    }
    if (password.length < 12) {
      return res.status(400).json({ success: false, message: 'Bootstrap password must be at least 12 characters.' })
    }

    const account = await prisma.account.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        passwordHash: await bcrypt.hash(password, 12),
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    })
    return res.status(201).json({
      success: true,
      message: 'Admin Created Successfully',
      savedAdmin: safeAccount(account)
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email already in use.' })
    }
    return next(error)
  }
}

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and password are required.' })
    }
    const account = await prisma.account.findUnique({
      where: { email: email.trim().toLowerCase() }
    })
    if (!account || account.status !== 'ACTIVE' ||
      !['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(account.role) ||
      !(await bcrypt.compare(password, account.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: account.id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )
    await prisma.account.update({ where: { id: account.id }, data: { lastLogin: new Date() } })
    res.cookie('adminId', account.id, authCookieOptions)
    return res.status(200).json({
      success: true,
      message: 'Admin Login Successfully',
      isAdmin: safeAccount(account),
      token
    })
  } catch (error) {
    return next(error)
  }
}

const adminCreateJobs = async (req, res, next) => {
  try {
    const { jobTitle, jobDescription, companyName, endDate } = req.body
    if (![jobTitle, jobDescription, companyName, endDate].every(value =>
      typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'All job fields are required.' })
    }
    const savedJob = await prisma.job.create({
      data: {
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        companyName: companyName.trim(),
        endDate: endDate.trim(),
        createdById: req.user.id
      }
    })
    return res.status(201).json({ success: true, message: 'Job Created Successfully', savedJob })
  } catch (error) {
    return next(error)
  }
}

const totalJobs = async (req, res, next) => {
  try {
    const jobsCount = await prisma.job.count()
    return res.status(200).json({ success: true, message: 'Total Jobs Successful', jobsCount })
  } catch (error) {
    return next(error)
  }
}

const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await prisma.account.count({ where: { role: 'APPLICANT' } })
    return res.status(200).json({ success: true, message: 'View All Users Successfully', allUsers })
  } catch (error) {
    return next(error)
  }
}

const getJobs = async (req, res, next) => {
  try {
    const jobs = (await prisma.job.findMany({ orderBy: { createdAt: 'desc' } }))
      .map(job => ({ ...job, _id: job.id }))
    return res.status(200).json({ success: true, message: 'View All Jobs Successfully', jobs })
  } catch (error) {
    return next(error)
  }
}

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.account.findMany({
      where: { role: 'APPLICANT' },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        applicantProfile: {
          select: { currentJob: true, qualification: true, phoneNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return res.status(200).json({ success: true, message: 'View all users successfully', users })
  } catch (error) {
    return next(error)
  }
}

const logoutAdmin = (req, res) => {
  res.clearCookie('adminId', { ...authCookieOptions, maxAge: undefined })
  return res.status(200).json({ success: true, message: 'Logged out successfully' })
}

module.exports = {
  adminRegister,
  adminLogin,
  adminCreateJobs,
  getAllUsers,
  totalJobs,
  logoutAdmin,
  getJobs,
  getUsers
}
