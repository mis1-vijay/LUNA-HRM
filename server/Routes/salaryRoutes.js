const express = require('express')
const { createSalary, listSalaries, getSalary, updatePaymentStatus } = require('../Controllers/salaryControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

const router = express.Router()
router.use(verifyToken)
router.post('/payroll', authorizeRoles('ADMIN', 'HR_MANAGER'), createSalary)
router.get('/payroll', authorizeRoles('ADMIN', 'HR_MANAGER', 'EMPLOYEE'), listSalaries)
router.get('/payroll/:id', authorizeRoles('ADMIN', 'HR_MANAGER', 'EMPLOYEE'), getSalary)
router.patch('/payroll/:id/payment', authorizeRoles('ADMIN', 'HR_MANAGER'), updatePaymentStatus)

module.exports = router
