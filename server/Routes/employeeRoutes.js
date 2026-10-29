const express = require('express')
const employeeRouter = express.Router()
const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getEmployeesByDepartment,
    getDepartmentStats
} = require('../Controllers/employeeControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

// Employee Routes
employeeRouter.use(verifyToken)
employeeRouter.post('/employee/create', authorizeRoles('ADMIN', 'HR_MANAGER'), createEmployee)
employeeRouter.get('/employees', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), getAllEmployees)
employeeRouter.get('/employee/:id', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'), getEmployeeById)
employeeRouter.put('/employee/:id', authorizeRoles('ADMIN', 'HR_MANAGER'), updateEmployee)
employeeRouter.delete('/employee/:id', authorizeRoles('ADMIN', 'HR_MANAGER'), deleteEmployee)
employeeRouter.get('/employees/department/:departmentId', authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), getEmployeesByDepartment)
employeeRouter.get('/stats/departments', authorizeRoles('ADMIN', 'HR_MANAGER'), getDepartmentStats)

module.exports = employeeRouter
