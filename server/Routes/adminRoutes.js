const express = require('express')
const adminRouter = express.Router()
const {
  adminRegister, adminLogin, adminCreateJobs, getAllUsers,
  totalJobs, logoutAdmin, getUsers
} = require('../Controllers/adminControllers')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')


// Routes
// User register
adminRouter.post('/admin-register', adminRegister)

// User login
adminRouter.post('/admin-login', adminLogin)

// Get All Users login
adminRouter.get('/admin-all-users', verifyToken, authorizeRoles('ADMIN', 'HR_MANAGER'), getAllUsers)


// Create Jobs
adminRouter.post('/admin-create-jobs', verifyToken, authorizeRoles('ADMIN', 'HR_MANAGER'), adminCreateJobs)


// Logout 
adminRouter.post('/admin-logout', logoutAdmin)

// Get All Jobs
adminRouter.get('/admin-total-jobs', verifyToken, authorizeRoles('ADMIN', 'HR_MANAGER'), totalJobs)

adminRouter.get('/users', verifyToken, authorizeRoles('ADMIN', 'HR_MANAGER'), getUsers)

module.exports = adminRouter