const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../Middlewares/adminMiddleware');
const {
    getAdminDashboard,
    getHRDashboard,
    getManagerDashboard,
    getEmployeeDashboard,
    getQuickStats
} = require('../Controllers/dashboardControllers');

// Admin dashboard
router.get('/dashboard/admin', verifyToken, authorizeRoles('ADMIN'), getAdminDashboard);

// HR Manager dashboard
router.get('/dashboard/hr', verifyToken, authorizeRoles('HR_MANAGER'), getHRDashboard);

// Department Manager dashboard
router.get('/dashboard/manager', verifyToken, authorizeRoles('DEPARTMENT_MANAGER'), getManagerDashboard);

// Employee dashboard
router.get('/dashboard/employee', verifyToken, authorizeRoles('EMPLOYEE'), getEmployeeDashboard);

// Quick stats (available to all roles)
router.get('/dashboard/stats', verifyToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'), getQuickStats);

module.exports = router;
