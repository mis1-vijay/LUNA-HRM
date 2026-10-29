const jwt = require('jsonwebtoken')
const prisma = require('../Database/prisma')

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!token) {
    return res.status(401).json({ auth: false, message: 'Authentication required.' })
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return next(new Error('JWT_SECRET must be configured with at least 32 characters.'))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded || typeof decoded !== 'object' || typeof decoded.id !== 'string') {
      return res.status(401).json({ auth: false, message: 'Invalid authentication token.' })
    }

    const account = await prisma.account.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        employeeProfile: { select: { id: true, employeeId: true } }
      }
    })

    if (!account || account.status !== 'ACTIVE') {
      return res.status(401).json({ auth: false, message: 'Account is unavailable.' })
    }

    req.user = {
      id: account.id,
      role: account.role,
      email: account.email,
      departmentId: account.departmentId,
      employeeId: account.employeeProfile?.id ?? null,
      employeeNumber: account.employeeProfile?.employeeId ?? null
    }
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ auth: false, message: 'Invalid or expired authentication token.' })
    }
    return next(error)
  }
}

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ auth: false, message: 'Authentication required.' })
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ auth: false, message: 'Insufficient permissions.' })
  }
  return next()
}

module.exports = {
  verifyToken,
  authorizeRoles,
  authorizedAdmin: verifyToken
}
