const express = require('express')
const userRouter = express.Router()
const {
  userRegister, userLogin, allJobs, logout, applyForJobs,
  viewAppliedJobs, updateUser, jobSingleView, getRecentJobs
} = require('../Controllers/userController')
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware')

// Routes
// User register
userRouter.post('/user-register', userRegister)
// User login
userRouter.post('/user-login', userLogin)

// All Jobs
userRouter.get('/all-jobs', verifyToken, authorizeRoles('APPLICANT'), allJobs)

// Update Users
userRouter.put('/update-user/:id', verifyToken, authorizeRoles('APPLICANT'), updateUser)

userRouter.post('/user-apply/:id', verifyToken, authorizeRoles('APPLICANT'), applyForJobs)

// get recent jobs
userRouter.get('/recent-jobs', getRecentJobs)

// View Single Job
userRouter.get('/single-job/:id', jobSingleView)

// Logout
userRouter.post('/user-logout',  logout)



userRouter.get('/getapplied-jobs/:id', verifyToken, authorizeRoles('APPLICANT'), viewAppliedJobs)

module.exports = userRouter
