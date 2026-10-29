const express = require('express')
const { applyLeave, listLeaves, reviewLeave, getLeaveBalances } = require('../Controllers/leaveControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

const router = express.Router()
router.use(verifyToken)
router.post('/leaves', authorizeRoles('EMPLOYEE'), applyLeave)
router.get('/leaves', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'), listLeaves)
router.get('/leaves/balance', authorizeRoles('EMPLOYEE'), getLeaveBalances)
router.patch('/leaves/:id/review', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), reviewLeave)

module.exports = router
