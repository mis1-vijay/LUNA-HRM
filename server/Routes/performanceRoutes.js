const express = require('express')
const { listReviews, createReview, approveReview } = require('../Controllers/performanceControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

const router = express.Router()
router.use(verifyToken)
router.get('/performance', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'), listReviews)
router.post('/performance', authorizeRoles('DEPARTMENT_MANAGER'), createReview)
router.patch('/performance/:id/approve', authorizeRoles('ADMIN', 'HR_MANAGER'), approveReview)

module.exports = router
