const express = require('express')
const {
  listDesignations, createDesignation, updateDesignation, deleteDesignation
} = require('../Controllers/designationControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

const router = express.Router()
router.use(verifyToken)
router.get('/designations', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), listDesignations)
router.post('/designations', authorizeRoles('ADMIN', 'HR_MANAGER'), createDesignation)
router.put('/designations/:id', authorizeRoles('ADMIN', 'HR_MANAGER'), updateDesignation)
router.delete('/designations/:id', authorizeRoles('ADMIN'), deleteDesignation)

module.exports = router
