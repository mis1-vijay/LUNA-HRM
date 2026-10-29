const prisma = require('../Database/prisma')

const listReviews = async (req, res, next) => {
  try {
    let where
    if (req.user.role === 'EMPLOYEE') {
      where = { employee: { accountId: req.user.id } }
    } else if (req.user.role === 'DEPARTMENT_MANAGER') {
      where = { employee: { departmentId: req.user.departmentId } }
    } else {
      where = req.query.employeeId ? { employeeId: String(req.query.employeeId) } : {}
    }
    const reviews = await prisma.performance.findMany({
      where,
      include: {
        employee: { select: { id: true, employeeId: true, firstName: true, lastName: true, departmentId: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    })
    return res.status(200).json({ success: true, reviews })
  } catch (error) {
    return next(error)
  }
}

const createReview = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'A linked employee profile is required to author a review.' })
    }
    const {
      employeeId, periodStartDate, periodEndDate, performanceMetrics,
      strengths, areasForImprovement, comments, recommendedActions, overallRating
    } = req.body
    const target = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, departmentId: true }
    })
    if (!target) return res.status(404).json({ success: false, message: 'Employee not found.' })
    if (req.user.role === 'DEPARTMENT_MANAGER' && target.departmentId !== req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Cannot review employees outside your department.' })
    }
    const names = ['productivity', 'quality', 'communication', 'teamwork', 'reliability', 'innovation']
    if (!performanceMetrics || names.some(name =>
      !Number.isInteger(Number(performanceMetrics[name])) ||
      Number(performanceMetrics[name]) < 1 ||
      Number(performanceMetrics[name]) > 5)) {
      return res.status(400).json({ success: false, message: 'All six performance metrics must be integers from 1 to 5.' })
    }
    const start = new Date(periodStartDate)
    const end = new Date(periodEndDate)
    const rating = Number(overallRating)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      end < start || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Review period and overall rating are invalid.' })
    }
    const review = await prisma.performance.create({
      data: {
        employeeId: target.id,
        periodStartDate: start,
        periodEndDate: end,
        reviewedById: req.user.employeeId,
        productivity: Number(performanceMetrics.productivity),
        quality: Number(performanceMetrics.quality),
        communication: Number(performanceMetrics.communication),
        teamwork: Number(performanceMetrics.teamwork),
        reliability: Number(performanceMetrics.reliability),
        innovation: Number(performanceMetrics.innovation),
        strengths: Array.isArray(strengths) ? strengths.filter(value => typeof value === 'string') : [],
        areasForImprovement: Array.isArray(areasForImprovement) ? areasForImprovement.filter(value => typeof value === 'string') : [],
        recommendedActions: Array.isArray(recommendedActions) ? recommendedActions.filter(value => typeof value === 'string') : [],
        comments: typeof comments === 'string' ? comments : null,
        overallRating: rating,
        status: 'SUBMITTED'
      }
    })
    return res.status(201).json({ success: true, review })
  } catch (error) {
    return next(error)
  }
}

const approveReview = async (req, res, next) => {
  try {
    const status = String(req.body.status || 'APPROVED').toUpperCase()
    if (!['APPROVED', 'SUBMITTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' })
    }
    const review = await prisma.performance.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(req.user.employeeId ? { approvedById: req.user.employeeId } : {}),
        approvalDate: new Date()
      }
    })
    return res.status(200).json({ success: true, review })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Review not found.' })
    return next(error)
  }
}

module.exports = { listReviews, createReview, approveReview }
