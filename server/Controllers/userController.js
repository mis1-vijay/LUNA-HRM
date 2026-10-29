const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../Database/prisma')

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000
}

const publicJob = job => job ? { ...job, _id: job.id } : job

const publicAccount = account => {
  const applicant = account.applicantProfile
  return {
    id: account.id,
    _id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    currentJob: applicant?.currentJob,
    jobDescription: applicant?.jobDescription,
    qualification: applicant?.qualification,
    DOB: applicant?.dateOfBirth,
    phoneNumber: applicant?.phoneNumber,
    applicant: applicant ?? undefined
  }
}

const userRegister = async (req, res, next) => {
  try {
    const {
      email, name, password, currentJob, jobDescription,
      qualification, DOB, phoneNumber
    } = req.body
    if (![email, name, password, currentJob, jobDescription, qualification, DOB, phoneNumber]
      .every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const passwordHash = await bcrypt.hash(password, 12)
    const account = await prisma.account.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role: 'APPLICANT',
        applicantProfile: {
          create: {
            currentJob: currentJob.trim(),
            jobDescription: jobDescription.trim(),
            qualification: qualification.trim(),
            dateOfBirth: DOB.trim(),
            phoneNumber: phoneNumber.trim()
          }
        }
      },
      include: { applicantProfile: true }
    })
    return res.status(201).json({
      success: true,
      message: 'User Created Successfully',
      savedUser: publicAccount(account)
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email already in use.' })
    }
    return next(error)
  }
}

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and password are required.' })
    }
    const account = await prisma.account.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { applicantProfile: true, employeeProfile: true }
    })
    if (!account || account.status !== 'ACTIVE' || account.role !== 'APPLICANT' ||
      !(await bcrypt.compare(password, account.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: account.id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )
    await prisma.account.update({ where: { id: account.id }, data: { lastLogin: new Date() } })
    res.cookie('userId', account.id, authCookieOptions)
    return res.status(200).json({
      success: true,
      message: 'User Login Successfully',
      isUser: publicAccount(account),
      token
    })
  } catch (error) {
    return next(error)
  }
}

const allJobs = async (req, res, next) => {
  try {
    const jobs = (await prisma.job.findMany({ orderBy: { createdAt: 'desc' } })).map(publicJob)
    return res.status(200).json({ success: true, message: 'View allJobs Successful', jobs })
  } catch (error) {
    return next(error)
  }
}

const applyForJobs = async (req, res, next) => {
  try {
    const { id: jobId } = req.params
    const applicant = await prisma.applicant.findUnique({ where: { accountId: req.user.id } })
    if (!applicant) return res.status(403).json({ success: false, message: 'Applicant account required.' })
    const { address, coverLetter, resume } = req.body
    if (![address, coverLetter, resume].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Address, cover letter, and resume are required.' })
    }
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } })
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' })

    const savedApplication = await prisma.jobApplication.create({
      data: { applicantId: applicant.id, jobId, address, coverLetter, resume }
    })
    return res.status(202).json({
      success: true,
      message: 'Application Submitted Successfully',
      savedApplication: { ...savedApplication, _id: savedApplication.id }
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' })
    }
    return next(error)
  }
}

const viewAppliedJobs = async (req, res, next) => {
  try {
    if (req.params.id && req.params.id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You may only view your own applications.' })
    }
    const applicant = await prisma.applicant.findUnique({
      where: { accountId: req.user.id },
      include: {
        applications: {
          include: { job: true },
          orderBy: { applicationDate: 'desc' }
        }
      }
    })
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant profile not found.' })
    return res.status(200).json({
      success: true,
      message: 'View Applied Jobs Successful',
      getJob: applicant.applications.map(application => ({
        ...application,
        _id: application.id,
        job: publicJob(application.job)
      }))
    })
  } catch (error) {
    return next(error)
  }
}

const updateUser = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You may only update your own profile.' })
    }
    const { name, currentJob, jobDescription, qualification, DOB, phoneNumber } = req.body
    const applicant = await prisma.applicant.findUnique({ where: { accountId: req.user.id } })
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant profile not found.' })
    const updatedUser = await prisma.account.update({
      where: { id: req.user.id },
      data: {
        ...(typeof name === 'string' ? { name: name.trim() } : {}),
        applicantProfile: {
          update: {
            ...(typeof currentJob === 'string' ? { currentJob: currentJob.trim() } : {}),
            ...(typeof jobDescription === 'string' ? { jobDescription: jobDescription.trim() } : {}),
            ...(typeof qualification === 'string' ? { qualification: qualification.trim() } : {}),
            ...(typeof DOB === 'string' ? { dateOfBirth: DOB.trim() } : {}),
            ...(typeof phoneNumber === 'string' ? { phoneNumber: phoneNumber.trim() } : {})
          }
        }
      },
      include: { applicantProfile: true }
    })
    return res.status(200).json({
      success: true,
      message: 'Update User Successfully',
      updatedUser: publicAccount(updatedUser)
    })
  } catch (error) {
    return next(error)
  }
}

const jobSingleView = async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } })
    const singleJob = job ? publicJob(job) : null
    if (!singleJob) return res.status(404).json({ success: false, message: 'Job not found.' })
    return res.status(200).json({ success: true, message: 'Single Job View Successfully', singleJob })
  } catch (error) {
    return next(error)
  }
}

const getRecentJobs = async (req, res, next) => {
  try {
    const days = Number(req.query.days ?? 7)
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      return res.status(400).json({ success: false, message: 'days must be an integer from 1 to 90.' })
    }
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const recentJobs = await prisma.job.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 6
    })
    return res.status(200).json({
      success: true,
      message: `Recent Jobs in the last ${days} days`,
      recentJobs: recentJobs.map(publicJob)
    })
  } catch (error) {
    return next(error)
  }
}

const logout = (req, res) => {
  res.clearCookie('userId', { ...authCookieOptions, maxAge: undefined })
  return res.status(200).json({ success: true, message: 'Logged out successfully' })
}

module.exports = {
  userRegister,
  userLogin,
  logout,
  applyForJobs,
  viewAppliedJobs,
  allJobs,
  updateUser,
  jobSingleView,
  getRecentJobs
}
