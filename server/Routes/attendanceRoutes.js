const express = require('express')
const {
  checkIn, checkOut, getAttendanceReport, getAllAttendance, approveAttendance
} = require('../Controllers/attendanceControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

const router = express.Router()
router.use(verifyToken)
router.post('/attendance/check-in', authorizeRoles('EMPLOYEE'), checkIn)
router.post('/attendance/check-out', authorizeRoles('EMPLOYEE'), checkOut)
router.get('/attendance/report', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'), getAttendanceReport)
router.get('/attendance', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), getAllAttendance)
router.put('/attendance/:attendanceId/approve', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), approveAttendance)

module.exports = router
