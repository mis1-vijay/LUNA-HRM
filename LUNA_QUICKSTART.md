# 🌙 Luna HRM - Quick Start Guide

## Local setup (PostgreSQL / Prisma)

### Step 1: Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend (in new terminal)
cd client
npm install
```

### Step 2: Configure Environment

Add these keys to `server/.env` without replacing existing values. Use your own local PostgreSQL or Supabase credentials; never commit populated connection strings.

```
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV=development
```

The pooled URL is for application connections; the direct URL is used by Prisma migrations. Configure `ADMIN_BOOTSTRAP_KEY` to enable one-time initial admin registration. Optional `SEED_ADMIN_*`, `SEED_HR_*`, `SEED_MANAGER_*`, and `SEED_EMPLOYEE_*` variables can provision accounts without putting passwords in source control.

Add the API URL to the existing `client/.env`:

```
VITE_API_URL=http://localhost:5000
```

### Step 3: Start Services

**Terminal 1 - Backend**

```bash
cd server
npm run prisma:validate
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm start
```

`prisma:push` is intended for a new/empty development database. Inspect any existing Supabase database before applying schema changes. For a production database, use reviewed version-controlled Prisma migrations instead of `db push`.

For local development only, `npm run prisma:seed-test-users` creates one account for each role in the database configured by `DATABASE_URL`. It stores unique generated credentials in the ignored `server/.env.test-users.local` file. Do not run this command against production or a shared database.

✅ Backend starts only after Prisma connects to PostgreSQL.

**Terminal 2 - Frontend**

```bash
cd client
npm run dev
```

✅ Frontend running on http://localhost:5173

---

## Access Points

### Admin Features

- **URL**: http://localhost:5173/admin-dashboard
- **Login Role**: Admin
- **Features**: System overview, employee management, payroll, reports

### HR Manager Features

- **URL**: http://localhost:5173/hr-dashboard
- **Login Role**: HR Manager
- **Features**: Recruitment, leave approvals, attendance tracking

### Department Manager Features

- **URL**: http://localhost:5173/manager-dashboard
- **Login Role**: Department Manager
- **Features**: Team management, performance reviews, attendance approval

### Employee Portal

- **URL**: http://localhost:5173/employee-dashboard
- **Login Role**: Employee
- **Features**: Leave requests, attendance, payslips, performance

---

## API Endpoints

### Dashboard APIs

#### Admin Dashboard

```bash
curl -X GET http://localhost:5000/api/v1/dashboard/admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: System overview with stats, charts, payroll summary

#### HR Manager Dashboard

```bash
curl -X GET http://localhost:5000/api/v1/dashboard/hr \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: Recruitment metrics, leave stats, pending approvals

#### Department Manager Dashboard

```bash
curl -X GET http://localhost:5000/api/v1/dashboard/manager \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: Team stats, attendance, leave requests

#### Employee Dashboard

```bash
curl -X GET http://localhost:5000/api/v1/dashboard/employee \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: Personal data, attendance, leave requests, payslips. The employee is resolved from the authenticated account; no employee ID belongs in the URL.

---

## Core Features at a Glance

| Feature            | Admin | HR Manager | Manager | Employee |
| ------------------ | ----- | ---------- | ------- | -------- |
| View Employees     | ✅    | ✅         | ✅      | ❌       |
| Manage Payroll     | ✅    | ✅         | ❌      | ❌       |
| Approve Leave      | ✅    | ✅         | ✅      | ❌       |
| Approve Attendance | ✅    | ✅         | ✅      | ❌       |
| View Dashboard     | ✅    | ✅         | ✅      | ✅       |
| Apply Leave        | ✅    | ✅         | ✅      | ✅       |
| View Payslip       | ✅    | ✅         | ✅      | ✅       |
| View Attendance    | ✅    | ✅         | ✅      | ✅       |

---

## PostgreSQL Tables

### Employees

- Full employee records with department, designation, reporting manager
- Skills, certifications, bank details, leave balance

### Departments

- Department info with manager assignment, budget tracking

### Attendance

- Daily check-in/out with work hours calculation

### Leaves

- Leave requests with 6 types and approval workflow

### Salary

- Monthly payroll with allowances and deductions

### Performance

- Performance reviews with 6 evaluation metrics

### Accounts

- User accounts with role-based permissions

---

## Key Database Relationships

```
Admin/Manager ─────┐
                   ├─→ Department
                   │
Employee ──────────┼─→ Department
    │              │
    ├─→ Designation (belongs to Department)
    ├─→ Manager (Employee reference)
    ├─→ Attendance Records
    ├─→ Leave Requests
    ├─→ Salary Records
    └─→ Performance Reviews
```

---

## File Structure

```
Luna HRM/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seedTestUsers.js
│   ├── Controllers/
│   │   ├── dashboardControllers.js (NEW)
│   │   ├── employeeControllers.js
│   │   └── ... (other controllers)
│   ├── Routes/
│   │   ├── dashboardRoutes.js (NEW)
│   │   ├── employeeRoutes.js
│   │   └── ... (other routes)
│   └── index.js (UPDATED)
│
├── client/
│   ├── src/
│   │   ├── Pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard/
│   │   │   │   │   ├── LunaAdminDashboard.jsx (NEW)
│   │   │   │   │   ├── LunaHRDashboard.jsx (NEW)
│   │   │   │   │   ├── LunaManagerDashboard.jsx (NEW)
│   │   │   │   │   └── AdminDashboard.jsx
│   │   │   │   └── ... (other admin pages)
│   │   │   └── Employee/
│   │   │       └── LunaEmployeeDashboard.jsx (NEW)
│   │   ├── API/
│   │   │   ├── adminApiCalls.js
│   │   │   └── employeeApiCalls.js
│   │   └── ... (other components)
│
├── LUNA_HRM_README.md
├── LUNA_QUICKSTART.md
└── README.md
```

---

## Common Tasks

### Create an Employee

```bash
POST /api/v1/employee/create
{
  "employeeId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@company.com",
  "department": "dept_id",
  "designation": "des_id",
  "salary": 60000
}
```

### Get All Employees

```bash
GET /api/v1/employees
```

### Get Admin Dashboard

```bash
GET /api/v1/dashboard/admin
```

### Get Employee Dashboard

```bash
GET /api/v1/dashboard/employee
```

---

## Troubleshooting

### Issue: Server won't start

```
Check that PostgreSQL/Supabase is reachable and the server's environment variables are configured
Check .env file configuration
Check port 5000 is not in use
```

### Issue: API returns 401

```
Token might be expired
Re-login to get new token
Check Authorization header format
```

### Issue: UI not loading

```
Check if backend is running
Verify VITE_API_URL in .env
Check browser console for errors
Clear browser cache
```

### Issue: Database connection error

```
Run `npm run prisma:validate` and confirm `DATABASE_URL` and `DIRECT_URL` are set
Check that the Supabase project is active and its connection settings match the URL type
```

### Verification status

The Prisma schema validates, and the configured database connection has passed a health check. Verify all role-specific workflows in a test environment before production use. Use `prisma db push` only for development databases; production schema changes require reviewed migrations.

---

## Dashboard Breakdown

### Admin Dashboard Features

1. **Summary Cards**
   - Total Active Employees
   - Present Today Count & Percentage
   - Pending Leave Requests
   - Department Count

2. **Charts**
   - Department Analytics (Bar Chart)
   - Attendance Trend (Area Chart)

3. **Tables**
   - Current Month Payroll Summary
   - Pending Approvals Widget

### HR Manager Dashboard Features

1. **Recruitment Metrics**
   - Pending Applications Count
   - New Hires Today

2. **Leave Analytics**
   - Status Breakdown (Pending, Approved, Rejected)
   - Leave Type Distribution
   - Detailed Pending Leaves Table

3. **Attendance Management**
   - Approval Status Statistics
   - Pending Attendance Approvals Table

### Manager Dashboard Features

1. **Team Overview**
   - Team Size
   - Present Today Count
   - On Leave Count
   - Pending Performance Reviews

2. **Management Tools**
   - Today's Attendance Summary
   - Department Information
   - Quick Action Buttons
   - Team Members Table

3. **Approval Workflows**
   - Team Leave Requests Table
   - Approve/Reject Actions

### Employee Dashboard Features

1. **Personal Profile**
   - Name, Email, Phone
   - Designation, Department
   - Reporting Manager
   - Profile Picture

2. **Attendance Tab**
   - Monthly attendance records
   - Present, Absent, Late counts

3. **Leave Balance Tab**
   - Paid Leave Balance
   - Sick Leave Balance
   - Casual Leave Balance
   - Recent Leave Requests
   - Apply for Leave Button

4. **Payslip Tab**
   - Latest Payslip Viewing
   - Gross & Net Salary
   - Deductions Breakdown
   - Payment Status

5. **Performance Tab**
   - Overall Rating (1-5)
   - Metrics Breakdown
   - Strengths & Areas for Improvement

---

## What's New in Luna HRM 2.0

✨ **4 Complete Dashboards** - Different for each role
📊 **Advanced Analytics** - Real-time data visualization
🔐 **Role-Based Access** - Secure authorization
👥 **Employee Management** - Complete CRUD operations
📅 **Attendance System** - Check-in/out with approvals
🏖️ **Leave Management** - Request and approval workflows
💰 **Payroll Module** - Salary processing and slips
⭐ **Performance Reviews** - Multi-metric evaluations
📱 **Responsive Design** - Works on all devices

---

## System Requirements

- **Node.js**: v18 or higher
- **PostgreSQL**: local or hosted (for example, Supabase)
- **Modern Browser**: Chrome, Firefox, Safari, Edge
- **npm**: compatible with the installed Node.js version

---

## Production Deployment Checklist

- [ ] Update .env with production values
- [ ] Configure production PostgreSQL pooled and direct URLs
- [ ] Set a strong `SECRET` and protect the bootstrap key
- [ ] Configure email service (Nodemailer)
- [ ] Set CORS origins correctly
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure logging
- [ ] Setup error monitoring
- [ ] Deploy backend (Heroku/AWS)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Test all workflows
- [ ] Setup email notifications

---

## Performance Tips

1. **Database Queries**: Use Prisma schema indexes on frequently queried fields
2. **Frontend**: Use lazy loading for heavy components
3. **Caching**: Enable Redis for session storage
4. **Images**: Optimize and compress media files
5. **API**: Implement response caching strategies

---

## Support & Resources

- **Documentation**: See LUNA_HRM_README.md
- **API Reference**: Check endpoints in this guide
- **Troubleshooting**: See the database and authentication troubleshooting sections below

---

## Getting Help

1. **Check Documentation**: LUNA_HRM_README.md
2. **Review Error Messages**: Check browser console
3. **Check Logs**: Review terminal output
4. **Database Issues**: Verify PostgreSQL connection and Prisma configuration
5. **API Issues**: Test with Postman
6. **UI Issues**: Clear cache and refresh

---

## Quick Commands Reference

```bash
# Start backend
cd server && npm start

# Start frontend
cd client && npm run dev

# Install dependencies
npm install

# Run tests (when available)
npm test

# Build for production
npm run build

# Check code quality
npm run lint
```

---

## Next Steps

1. ✅ System is running
2. 🔄 Explore each dashboard
3. 📚 Read full documentation
4. 🧪 Test API endpoints
5. 🎨 Customize to your needs
6. 🚀 Deploy to production

---

**Version**: 2.0  
**Status**: ✅ Ready to Use  
**Last Updated**: January 20, 2026

🌙 **Welcome to Luna HRM!**
