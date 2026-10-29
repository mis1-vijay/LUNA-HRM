const express = require('express')
const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment, canManage
} = require('../Controllers/departmentControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

const router = express.Router()
router.use(verifyToken)
router.get('/departments', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), listDepartments)
router.post('/departments', authorizeRoles('ADMIN', 'HR_MANAGER'), createDepartment)
router.put('/departments/:id', authorizeRoles('ADMIN', 'HR_MANAGER'), updateDepartment)
router.delete('/departments/:id', authorizeRoles('ADMIN'), deleteDepartment)

module.exports = router
