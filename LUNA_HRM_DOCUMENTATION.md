# 🌙 Luna HRM - Complete System Documentation

## Overview

**Luna HRM** is a comprehensive Human Resource Management System built with the MERN stack (MongoDB, Express, React, Node.js). It provides complete HR functionality with role-based dashboards for Admins, HR Managers, Department Managers, and Employees.

---

## 🎯 System Features

### 1. **Role-Based Access Control**

- **Admin**: Full system control, employee management, payroll, reports
- **HR Manager**: Recruitment, leave approvals, attendance, compliance
- **Department Manager**: Team management, performance reviews, attendance approval
- **Employee**: Self-service portal, leave requests, attendance, payslips

### 2. **Employee Management**

- Complete employee records with skills, certifications, bank details
- Department and designation management
- Hierarchical reporting structure
- Document management and uploads

### 3. **Attendance System**

- Daily check-in/check-out tracking
- GPS location verification
- Automated late marking
- Monthly attendance reports
- Approval workflow for anomalies

### 4. **Leave Management**

- 6 types of leaves (Paid, Sick, Casual, Maternity, Paternity, Unpaid)
- Leave request submission and approval workflow
- Leave balance tracking
- Document attachments for leave requests
- Leave reports and analytics

### 5. **Payroll System**

- Monthly salary processing
- Allowances (Dearness, HRA, Medical, Conveyance)
- Deductions (PF, Income Tax, Professional Tax)
- Overtime calculation
- Payslip generation and delivery
- Payment tracking and status management

### 6. **Performance Management**

- Multi-metric performance reviews (1-5 scale)
- 6 evaluation criteria:
  - Productivity
  - Quality
  - Communication
  - Teamwork
  - Reliability
  - Innovation
- Strengths and areas for improvement tracking
- Performance history and trends

### 7. **Dashboard Analytics**

- Real-time system statistics
- Department-wise analytics
- Attendance trends
- Payroll summaries
- Leave analytics
- Performance insights

---

## 📊 Database Architecture

### Collections Overview

#### **Employees**

```javascript
{
  employeeId, firstName, lastName, email, phone, dateOfBirth,
  gender, department, designation, reportingManager, joinDate,
  employmentType, address, emergencyContact, bankDetails,
  salary, status, profileImage, documents, skills, certifications,
  leaveBalance: { paid, sick, casual }
}
```

#### **Departments**

```javascript
{
  (departmentName,
    departmentCode,
    description,
    manager,
    numberOfEmployees,
    budget,
    status);
}
```

#### **Designations**

```javascript
{
  designationName, designationCode, description, department,
  level (entry/junior/senior/lead/manager/executive),
  salary_range: { min, max }, numberOfPositions, status
}
```

#### **Attendance**

```javascript
{
  (employee,
    date,
    checkInTime,
    checkOutTime,
    status(present / absent / half_day / late / on_leave),
    workHours,
    location,
    remarks,
    approvedBy,
    approvalStatus);
}
```

#### **Leaves**

```javascript
{
  (employee,
    leaveType,
    startDate,
    endDate,
    numberOfDays,
    reason,
    attachments,
    status,
    approvedBy,
    approvalDate,
    isEmergency);
}
```

#### **Salary**

```javascript
{
  employee, month, year, baseSalary,
  allowances: { dearness, house_rent, medical, conveyance },
  deductions: { pf, incomeTax, professionalTax },
  attendanceDays, overtimeHours, overtimeAmount,
  grossSalary, netSalary, paymentStatus, paymentMethod
}
```

#### **Performance**

```javascript
{
  employee, period: { startDate, endDate }, reviewedBy,
  performanceMetrics: {
    productivity, quality, communication,
    teamwork, reliability, innovation
  },
  strengths, areasForImprovement, comments,
  overallRating, status
}
```

#### **Admins**

```javascript
{
  (email,
    name,
    firstName,
    lastName,
    password,
    phone,
    role(admin / hr_manager / department_manager),
    department,
    profileImage,
    permissions,
    status,
    lastLogin);
}
```

---

## 🎨 Dashboard Layouts

### Admin Dashboard

**URL**: `/api/v1/dashboard/admin`

**Features**:

- 4 Summary Cards: Active Employees, Present Today, Pending Leaves, Departments
- Department Analytics (Bar Chart)
- Attendance Trend (Area Chart - 7 days)
- Payroll Summary (Table)
- Pending Approvals count

**Frontend Component**: `LunaAdminDashboard.jsx`

### HR Manager Dashboard

**URL**: `/api/v1/dashboard/hr`

**Features**:

- Recruitment Metrics (Pending Applications, New Hires)
- Leave Requests Status
- Leave by Type breakdown
- Attendance Approval Statistics
- Pending Leave Requests Table
- Pending Attendance Approvals Table

**Frontend Component**: `LunaHRDashboard.jsx`

### Department Manager Dashboard

**URL**: `/api/v1/dashboard/manager`

**Features**:

- Team Size metrics
- Present Today count
- On Leave count
- Pending Reviews count
- Today's Attendance Summary
- Department Information
- Quick Actions
- Team Members Table
- Team Leave Requests Table

**Frontend Component**: `LunaManagerDashboard.jsx`

### Employee Dashboard

**URL**: `/api/v1/dashboard/employee/:employeeId`

**Features**:

- Profile Information
- Attendance Summary (Present, Absent, Late, Total)
- Leave Balance (Paid, Sick, Casual)
- Recent Leave Requests
- Latest Payslip
- Performance Rating
- Apply for Leave Button

**Frontend Component**: `LunaEmployeeDashboard.jsx`

---

## 🔌 API Endpoints

### Dashboard Routes

```
GET  /api/v1/dashboard/admin         - Admin dashboard data
GET  /api/v1/dashboard/hr            - HR manager dashboard data
GET  /api/v1/dashboard/manager       - Department manager dashboard data
GET  /api/v1/dashboard/employee/:id  - Employee dashboard data
GET  /api/v1/dashboard/stats         - Quick statistics
```

### Employee Management

```
POST   /api/v1/employee/create                    - Create employee
GET    /api/v1/employees                         - Get all employees
GET    /api/v1/employee/:id                      - Get single employee
PUT    /api/v1/employee/:id                      - Update employee
DELETE /api/v1/employee/:id                      - Delete employee
GET    /api/v1/employees/department/:departmentId - Get by department
GET    /api/v1/stats/departments                 - Department statistics
```

### Attendance (Prepared, UI Pending)

```
POST   /api/v1/attendance/checkin    - Check-in
POST   /api/v1/attendance/checkout   - Check-out
GET    /api/v1/attendance/report     - Attendance report
GET    /api/v1/attendance            - All attendance
POST   /api/v1/attendance/approve    - Approve attendance
```

### Leave (Models Ready, API Pending)

```
POST   /api/v1/leave/request        - Request leave
GET    /api/v1/leaves               - Get all leaves
GET    /api/v1/leave/:id            - Get single leave
PUT    /api/v1/leave/:id            - Update leave
POST   /api/v1/leave/approve        - Approve leave
```

### Payroll (Models Ready, API Pending)

```
POST   /api/v1/payroll/process      - Process payroll
GET    /api/v1/payroll              - Get all payroll records
GET    /api/v1/payslip/:id          - Get payslip
```

---

## 🛠️ Technology Stack

### Backend

- **Node.js** v14+
- **Express.js** 4.x
- **MongoDB** 4.x
- **Mongoose** 6.x
- **JWT** Authentication
- **Bcrypt** Password hashing
- **CORS** & **Cookie-Parser**
- **Nodemailer** (Email notifications - future)

### Frontend

- **React** 18.2.0
- **Vite** 5.0.8
- **MDB React** 4.1.0 (UI Components)
- **ApexCharts** (Charts & Analytics)
- **Axios** (API Calls)
- **React Router** 6.21.1
- **React Toastify** (Notifications)
- **Bootstrap** 5.3.2
- **SCSS** (Styling)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v14+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

#### 1. Clone Repository

```bash
git clone <repository-url>
cd HRMS-master
```

#### 2. Setup Backend

```bash
cd server
npm install
```

Create `.env` file:

```
PORT=5000
MONGODB_URL=mongodb://localhost:27017/luna_hrm
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

#### 3. Setup Frontend

```bash
cd ../client
npm install
```

Create `.env` file:

```
VITE_API_URL=http://localhost:5000
```

#### 4. Run Application

**Terminal 1 - Backend**:

```bash
cd server
npm start
```

Server runs on `http://localhost:5000`

**Terminal 2 - Frontend**:

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 📋 Workflow Examples

### Employee Registration Workflow

1. Admin navigates to Employee Management
2. Clicks "Create New Employee"
3. Fills employee details (name, email, department, designation)
4. System validates and creates employee record
5. Employee receives login credentials
6. Employee logs in and updates profile

### Leave Request Workflow

1. Employee applies for leave (start date, end date, reason)
2. Department Manager receives notification
3. Manager reviews and approves/rejects
4. Employee receives approval notification
5. Attendance system marks days as "on_leave"
6. Payroll system adjusts accordingly

### Payroll Processing Workflow

1. HR Manager initiates month-end payroll
2. System calculates gross salary (base + allowances)
3. Deductions applied (PF, taxes)
4. Net salary calculated
5. Payslips generated
6. Payment scheduled
7. Employees can view payslips in self-service portal

### Performance Review Workflow

1. Manager accesses team member's profile
2. Starts performance review (productivity, quality, etc.)
3. Provides ratings (1-5 scale)
4. Adds strengths and improvement areas
5. Saves draft/submits for approval
6. HR Manager reviews and approves
7. Employee receives feedback notification

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with 10 salt rounds
- **Role-Based Access Control**: Middleware enforcement
- **Protected Routes**: All sensitive endpoints require authorization
- **HTTP-Only Cookies**: For session management
- **CORS Protection**: Configured origin validation
- **Email Validation**: Input validation on all forms
- **Data Encryption**: Sensitive fields encrypted where needed

---

## 📱 Frontend Components Structure

```
client/src/
├── Pages/
│   ├── Admin/
│   │   ├── Dashboard/
│   │   │   ├── LunaAdminDashboard.jsx
│   │   │   ├── LunaHRDashboard.jsx
│   │   │   ├── LunaManagerDashboard.jsx
│   │   │   └── AdminDashboard.jsx (original)
│   │   ├── Employees/
│   │   │   └── ManageEmployees.jsx
│   │   ├── Sidebar/
│   │   │   └── AdminSidebar.jsx
│   │   └── ... (other admin pages)
│   └── Employee/
│       └── LunaEmployeeDashboard.jsx
├── API/
│   ├── adminApiCalls.js
│   ├── employeeApiCalls.js
│   └── (new files for attendance, payroll, leave)
└── Components/
    └── (reusable components)
```

---

## 🔄 API Response Format

All API responses follow this format:

```javascript
// Success Response
{
  success: true,
  data: { /* response data */ }
}

// Error Response
{
  success: false,
  message: "Error description"
}
```

---

## 📈 Performance Considerations

### Database Optimization

- Indexes on frequently queried fields (email, employeeId, department)
- Compound indexes for unique constraints
- Aggregation pipelines for analytics
- Population with selective field retrieval

### Frontend Optimization

- Code splitting with Vite
- Component lazy loading
- Memoization of expensive components
- Efficient state management
- Image optimization

### Caching Strategy

- JWT tokens in localStorage
- API response caching
- Static file caching via service worker

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

```
Error: connect ECONNREFUSED
Solution: Ensure MongoDB is running
          Check MONGODB_URL in .env
          Try: mongod (if local)
```

### API 401 Unauthorized

```
Solution: Verify JWT token is valid
          Check Authorization header format
          Token might be expired, re-login required
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
Solution: Kill process on port
          Windows: netstat -ano | findstr :5000
          Linux: lsof -i :5000
```

### CORS Errors

```
Solution: Check CORS middleware configuration in server/index.js
          Verify frontend URL is in allowed origins
          Use withCredentials: true in axios calls
```

---

## 📝 Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URL=mongodb://localhost:27017/luna_hrm
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=1d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NODE_ENV=development
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000
VITE_APP_VERSION=2.0.0
VITE_APP_NAME=Luna HRM
```

---

## 🎓 Learning Resources

### React Concepts Used

- Hooks (useState, useEffect, useContext)
- Custom hooks
- Component composition
- Prop drilling and Context API

### Express.js Patterns

- Middleware functions
- Route organization
- Controller separation
- Error handling

### MongoDB Patterns

- Schema design
- Relationships (refs and arrays)
- Aggregation pipelines
- Indexes and query optimization

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel)

```bash
npm install -g vercel
vercel
# Follow prompts and deploy
```

### Backend Deployment (Heroku)

```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Environment Variables on Production

- Update MongoDB_URL to Atlas connection
- Change JWT_SECRET to strong random key
- Update VITE_API_URL to production backend URL
- Configure email credentials for notifications

---

## 📞 Support & Contribution

For issues, feature requests, or contributions:

1. Create GitHub issue with detailed description
2. Include error logs and screenshots
3. Submit pull requests with clear commit messages
4. Follow code style guidelines

---

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 🎉 Version History

### v2.0 (Current)

- ✅ Role-based dashboards
- ✅ Employee management
- ✅ Attendance system (API ready)
- ✅ Leave management (API ready)
- ✅ Payroll system (API ready)
- ✅ Performance management (API ready)
- ✅ Self-service portal (Employee)
- 🔄 UI implementation in progress

### v1.0 (Previous)

- Basic job portal
- User registration
- Job postings
- Simple admin dashboard

---

**Last Updated**: January 20, 2026  
**Version**: 2.0  
**Status**: ✅ In Active Development  
**Support**: GitHub Issues & Discussions

---

## Quick Links

- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:5000
- 📚 **API Documentation**: See INTEGRATION_GUIDE.md
- 📋 **Features Overview**: See FEATURES_AND_MODULES.md
- 🔧 **Integration Examples**: See INTEGRATION_GUIDE.md

---

Made with ❤️ for HR Teams  
**Luna HRM - Your Complete HR Solution**
