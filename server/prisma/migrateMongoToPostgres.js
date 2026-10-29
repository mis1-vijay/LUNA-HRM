require('dotenv').config()

const mongoose = require('mongoose')
const prisma = require('../Database/prisma')

const mongoCollections = {
  usermodels: 'usermodels',
  admins: 'admins',
  departments: 'departments',
  designations: 'designations',
  employees: 'employees',
  attendance: 'attendances',
  leaves: 'leaves',
  salaries: 'salaries',
  performances: 'performances',
  jobsmodels: 'jobsmodels',
  appforjobsmodel: 'appforjobsmodels'
}

const idOf = value => {
  if (value === null || value === undefined) return null
  return String(value._id ?? value)
}

const dateOf = (value, label) => {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new Error(`Invalid ${label} date: ${value}`)
  return date
}

const dateOnly = (value, label) => {
  const date = dateOf(value, label)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

const timeOnDay = (day, value) => {
  if (!value) return null
  const text = String(value).trim()
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i)
  if (!match) throw new Error(`Unsupported attendance time value: ${text}`)
  let hour = Number(match[1])
  const suffix = match[4]?.toUpperCase()
  if (suffix === 'PM' && hour < 12) hour += 12
  if (suffix === 'AM' && hour === 12) hour = 0
  const date = dateOnly(day, 'attendance.time')
  date.setUTCHours(hour, Number(match[2]), Number(match[3] || 0), 0)
  return date
}

const status = (value, fallback) => String(value || fallback).toUpperCase()
const employmentType = value =>
  String(value || 'permanent').toLowerCase() === 'parttime'
    ? 'PART_TIME'
    : status(value, 'permanent')
const role = value => {
  const legacyRole = String(value || 'admin').toLowerCase()
  const mappedRole = {
    admin: 'ADMIN',
    hr_manager: 'HR_MANAGER',
    department_manager: 'DEPARTMENT_MANAGER'
  }[legacyRole]
  if (!mappedRole) throw new Error(`Unsupported legacy account role: ${legacyRole}`)
  return mappedRole
}

const upsert = async (model, id, data) =>
  model.upsert({ where: { id }, create: { id, ...data }, update: data })

const writeCheckpoint = async (collection, sourceId, model, targetId) =>
  prisma.legacyImport.upsert({
    where: { sourceCollection_sourceId: { sourceCollection: collection, sourceId } },
    create: { sourceCollection: collection, sourceId, targetModel: model, targetId },
    update: { targetModel: model, targetId, importedAt: new Date() }
  })

const audit = async () => {
  await mongoose.connect(process.env.MONGODB_URL)
  const counts = {}
  for (const [modelName, collection] of Object.entries(mongoCollections)) {
    counts[modelName] = await mongoose.connection.db.collection(collection).countDocuments()
  }
  console.log('MongoDB source record counts:', counts)
  console.log('No rows were written. Re-run with --execute only after verified backups.')
}

const migrate = async () => {
  if (process.env.MONGO_MIGRATION_BACKUP_CONFIRMED !== 'YES') {
    throw new Error('Set MONGO_MIGRATION_BACKUP_CONFIRMED=YES only after creating and verifying a MongoDB backup.')
  }
  await mongoose.connect(process.env.MONGODB_URL)

  const read = async modelName =>
    mongoose.connection.db.collection(mongoCollections[modelName]).find({}).toArray()
  const departments = await read('departments')
  const designations = await read('designations')
  const admins = await read('admins')
  const users = await read('usermodels')
  const employees = await read('employees')
  const jobs = await read('jobsmodels')

  for (const row of departments) {
    const id = idOf(row)
    await upsert(prisma.department, id, {
      departmentName: row.departmentName,
      departmentCode: row.departmentCode,
      description: row.description ?? null,
      numberOfEmployees: Number(row.numberOfEmployees ?? 0),
      budget: row.budget ?? 0,
      status: status(row.status, 'active'),
      createdAt: row.createdAt ? dateOf(row.createdAt, 'department.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'department.updatedAt') : new Date()
    })
    await writeCheckpoint('departments', id, 'Department', id)
  }

  for (const row of admins) {
    const id = idOf(row)
    const departmentId = idOf(row.department)
    await upsert(prisma.account, id, {
      email: String(row.email).toLowerCase(),
      name: row.name,
      firstName: row.firstName ?? null,
      lastName: row.lastName ?? null,
      passwordHash: row.password,
      phone: row.phone ?? null,
      role: role(row.role),
      status: status(row.status, 'active'),
      profileImage: row.profileImage ?? null,
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
      isVerified: Boolean(row.isVerified),
      lastLogin: row.lastLogin ? dateOf(row.lastLogin, 'admin.lastLogin') : null,
      loginAttempts: Number(row.loginAttempts ?? 0),
      lockedUntil: row.lockedUntil ? dateOf(row.lockedUntil, 'admin.lockedUntil') : null,
      departmentId: departments.some(dept => idOf(dept) === departmentId) ? departmentId : null,
      createdAt: row.createdAt ? dateOf(row.createdAt, 'admin.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'admin.updatedAt') : new Date()
    })
    await writeCheckpoint('admins', id, 'Account', id)
  }

  for (const row of users) {
    const id = idOf(row)
    const account = await upsert(prisma.account, id, {
      email: String(row.email).toLowerCase(),
      name: row.name,
      passwordHash: row.password,
      role: 'APPLICANT',
      status: 'ACTIVE',
      createdAt: row.createdAt ? dateOf(row.createdAt, 'user.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'user.updatedAt') : new Date()
    })
    await upsert(prisma.applicant, id, {
      accountId: account.id,
      currentJob: row.currentJob ?? '',
      jobDescription: row.jobDescription ?? '',
      qualification: row.qualification ?? '',
      dateOfBirth: String(row.DOB ?? ''),
      phoneNumber: String(row.phoneNumber ?? ''),
      createdAt: row.createdAt ? dateOf(row.createdAt, 'user.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'user.updatedAt') : new Date()
    })
    await writeCheckpoint('usermodels', id, 'Applicant', id)
  }

  for (const row of designations) {
    const id = idOf(row)
    const range = row.salary_range || {}
    await upsert(prisma.designation, id, {
      designationName: row.designationName,
      designationCode: row.designationCode,
      description: row.description ?? null,
      departmentId: idOf(row.department),
      level: status(row.level, 'junior'),
      salaryRangeMin: range.min ?? null,
      salaryRangeMax: range.max ?? null,
      numberOfPositions: Number(row.numberOfPositions ?? 0),
      status: status(row.status, 'active'),
      createdAt: row.createdAt ? dateOf(row.createdAt, 'designation.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'designation.updatedAt') : new Date()
    })
    await writeCheckpoint('designations', id, 'Designation', id)
  }

  for (const row of employees) {
    const id = idOf(row)
    const managerId = idOf(row.reportingManager)
    const employeeData = {
      employeeId: row.employeeId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: String(row.email).toLowerCase(),
      phone: String(row.phone),
      dateOfBirth: dateOf(row.dateOfBirth, 'employee.dateOfBirth'),
      gender: status(row.gender, 'other'),
      departmentId: idOf(row.department),
      designationId: idOf(row.designation),
      reportingManagerId: employees.some(candidate => idOf(candidate) === managerId) ? managerId : null,
      joinDate: dateOf(row.joinDate, 'employee.joinDate'),
      employmentType: employmentType(row.employmentType),
      addressStreet: row.address?.street ?? null,
      addressCity: row.address?.city ?? null,
      addressState: row.address?.state ?? null,
      addressCountry: row.address?.country ?? null,
      addressZipCode: row.address?.zipCode ?? null,
      emergencyName: row.emergencyContact?.name ?? null,
      emergencyRelationship: row.emergencyContact?.relationship ?? null,
      emergencyPhone: row.emergencyContact?.phone ?? null,
      bankAccountNumber: row.bankDetails?.accountNumber ?? null,
      bankName: row.bankDetails?.bankName ?? null,
      bankIfscCode: row.bankDetails?.ifscCode ?? null,
      bankAccountHolder: row.bankDetails?.accountHolder ?? null,
      salary: row.salary,
      status: status(row.status, 'active'),
      profileImage: row.profileImage ?? null,
      paidLeaveBalance: row.leaveBalance?.paidLeave ?? 20,
      sickLeaveBalance: row.leaveBalance?.sickLeave ?? 10,
      casualLeaveBalance: row.leaveBalance?.casualLeave ?? 5,
      createdAt: row.createdAt ? dateOf(row.createdAt, 'employee.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'employee.updatedAt') : new Date()
    }
    await upsert(prisma.employee, id, employeeData)
    await prisma.employeeSkill.deleteMany({ where: { employeeId: id } })
    if (Array.isArray(row.skills) && row.skills.length) {
      await prisma.employeeSkill.createMany({
        data: [...new Set(row.skills.filter(value => typeof value === 'string'))]
          .map(name => ({ employeeId: id, name })),
        skipDuplicates: true
      })
    }
    await prisma.employeeDocument.deleteMany({ where: { employeeId: id } })
    if (Array.isArray(row.documents) && row.documents.length) {
      await prisma.employeeDocument.createMany({
        data: row.documents.map(doc => ({
          employeeId: id,
          documentName: doc.documentName ?? null,
          documentType: doc.documentType ?? null,
          documentUrl: doc.documentUrl ?? null,
          uploadedAt: doc.uploadDate ? dateOf(doc.uploadDate, 'employee.document.uploadDate') : new Date()
        }))
      })
    }
    await prisma.certification.deleteMany({ where: { employeeId: id } })
    if (Array.isArray(row.certifications) && row.certifications.length) {
      await prisma.certification.createMany({
        data: row.certifications.map(item => ({
          employeeId: id,
          certificationName: item.certificationName || 'Unnamed certification',
          issuingOrganization: item.issuingOrganization ?? null,
          issueDate: item.issueDate ? dateOf(item.issueDate, 'certification.issueDate') : null,
          expiryDate: item.expiryDate ? dateOf(item.expiryDate, 'certification.expiryDate') : null,
          certificateUrl: item.certificateUrl ?? null
        }))
      })
    }
    await writeCheckpoint('employees', id, 'Employee', id)
  }

  for (const row of jobs) {
    const id = idOf(row)
    await upsert(prisma.job, id, {
      jobTitle: row.jobTitle,
      jobDescription: row.jobDescription,
      companyName: row.companyName,
      startDate: row.startDate ? dateOf(row.startDate, 'job.startDate') : new Date(),
      endDate: String(row.endDate ?? ''),
      createdAt: row.createdAt ? dateOf(row.createdAt, 'job.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'job.updatedAt') : new Date()
    })
    await writeCheckpoint('jobsmodels', id, 'Job', id)
  }

  const attendance = await read('attendance')
  for (const row of attendance) {
    const id = idOf(row)
    await upsert(prisma.attendance, id, {
      employeeId: idOf(row.employee),
      date: dateOnly(row.date, 'attendance.date'),
      checkInTime: timeOnDay(row.date, row.checkInTime),
      checkOutTime: timeOnDay(row.date, row.checkOutTime),
      status: status(row.status, 'present'),
      workHours: row.workHours ?? 0,
      latitude: row.location?.latitude ? Number(row.location.latitude) : null,
      longitude: row.location?.longitude ? Number(row.location.longitude) : null,
      remarks: row.remarks ?? null,
      approvedById: employees.some(employee => idOf(employee) === idOf(row.approvedBy)) ? idOf(row.approvedBy) : null,
      approvalStatus: status(row.approvalStatus, 'pending'),
      createdAt: row.createdAt ? dateOf(row.createdAt, 'attendance.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'attendance.updatedAt') : new Date()
    })
    await writeCheckpoint('attendance', id, 'Attendance', id)
  }

  const leaves = await read('leaves')
  for (const row of leaves) {
    const id = idOf(row)
    await upsert(prisma.leaveRequest, id, {
      employeeId: idOf(row.employee),
      leaveType: status(row.leaveType, 'paid_leave'),
      startDate: dateOnly(row.startDate, 'leave.startDate'),
      endDate: dateOnly(row.endDate, 'leave.endDate'),
      numberOfDays: row.numberOfDays,
      reason: row.reason,
      status: status(row.status, 'pending'),
      approvedById: employees.some(employee => idOf(employee) === idOf(row.approvedBy)) ? idOf(row.approvedBy) : null,
      approvalDate: row.approvalDate ? dateOf(row.approvalDate, 'leave.approvalDate') : null,
      approvalRemarks: row.approvalRemarks ?? null,
      isEmergency: Boolean(row.isEmergency),
      createdAt: row.createdAt ? dateOf(row.createdAt, 'leave.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'leave.updatedAt') : new Date()
    })
    await prisma.leaveAttachment.deleteMany({ where: { leaveRequestId: id } })
    if (Array.isArray(row.attachments) && row.attachments.length) {
      await prisma.leaveAttachment.createMany({
        data: row.attachments.map(item => ({
          leaveRequestId: id,
          fileName: item.fileName ?? null,
          fileUrl: item.fileUrl ?? null,
          uploadedAt: item.uploadDate ? dateOf(item.uploadDate, 'leave.attachment.uploadDate') : new Date()
        }))
      })
    }
    await writeCheckpoint('leaves', id, 'LeaveRequest', id)
  }

  const salaries = await read('salaries')
  for (const row of salaries) {
    const id = idOf(row)
    const allowances = row.allowances || {}
    const deductions = row.deductions || {}
    await upsert(prisma.salary, id, {
      employeeId: idOf(row.employee),
      month: String(row.month),
      year: Number(row.year),
      baseSalary: row.baseSalary,
      dearnessAllowance: allowances.dearness ?? 0,
      houseRentAllowance: allowances.house_rent ?? 0,
      medicalAllowance: allowances.medical ?? 0,
      conveyanceAllowance: allowances.conveyance ?? 0,
      otherAllowance: allowances.other ?? 0,
      providentFund: deductions.providentFund ?? 0,
      incomeTax: deductions.incomeTax ?? 0,
      professionalTax: deductions.professionalTax ?? 0,
      otherDeductions: deductions.otherDeductions ?? 0,
      attendanceDays: row.attendanceDays ?? 0,
      overtimeHours: row.overtimeHours ?? 0,
      overtimeAmount: row.overtimeAmount ?? 0,
      grossSalary: row.grossSalary,
      netSalary: row.netSalary,
      paymentStatus: status(row.paymentStatus, 'pending'),
      paymentDate: row.paymentDate ? dateOf(row.paymentDate, 'salary.paymentDate') : null,
      paymentMethod: status(row.paymentMethod, 'bank_transfer'),
      remarks: row.remarks ?? null,
      createdAt: row.createdAt ? dateOf(row.createdAt, 'salary.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'salary.updatedAt') : new Date()
    })
    await writeCheckpoint('salaries', id, 'Salary', id)
  }

  const performances = await read('performances')
  for (const row of performances) {
    const id = idOf(row)
    const metrics = row.performanceMetrics || {}
    await upsert(prisma.performance, id, {
      employeeId: idOf(row.employee),
      periodStartDate: dateOnly(row.period?.startDate, 'performance.period.startDate'),
      periodEndDate: dateOnly(row.period?.endDate, 'performance.period.endDate'),
      reviewedById: idOf(row.reviewedBy),
      productivity: Number(metrics.productivity),
      quality: Number(metrics.quality),
      communication: Number(metrics.communication),
      teamwork: Number(metrics.teamwork),
      reliability: Number(metrics.reliability),
      innovation: Number(metrics.innovation),
      strengths: row.strengths || [],
      areasForImprovement: row.areasForImprovement || [],
      comments: row.comments ?? null,
      recommendedActions: row.recommendedActions || [],
      overallRating: row.overallRating,
      status: status(row.status, 'draft'),
      approvedById: employees.some(employee => idOf(employee) === idOf(row.approvedBy)) ? idOf(row.approvedBy) : null,
      approvalDate: row.approvalDate ? dateOf(row.approvalDate, 'performance.approvalDate') : null,
      createdAt: row.createdAt ? dateOf(row.createdAt, 'performance.createdAt') : new Date(),
      updatedAt: row.updatedAt ? dateOf(row.updatedAt, 'performance.updatedAt') : new Date()
    })
    await writeCheckpoint('performances', id, 'Performance', id)
  }

    const applicationsByPair = new Map()
    for (const user of users) {
      const applicantId = idOf(user)
      for (const application of user.appliedJobs || []) {
        const jobId = idOf(application.job)
        if (!jobId || !jobs.some(job => idOf(job) === jobId)) continue
        const key = `${applicantId}:${jobId}`
        applicationsByPair.set(key, {
          id: idOf(application) || key,
          applicantId,
          jobId,
          applicationStatus: status(application.applicationStatus, 'pending'),
          applicationDate: application.applicationDate
            ? dateOf(application.applicationDate, 'application.applicationDate')
            : new Date(),
          sourceCollection: 'user.appliedJobs',
          sourceId: idOf(application) || key
        })
      }
    }
    for (const job of jobs) {
      const jobId = idOf(job)
      for (const application of job.applicants || []) {
        const applicantId = idOf(application.applicant)
        if (!applicantId || !users.some(user => idOf(user) === applicantId)) continue
        const key = `${applicantId}:${jobId}`
        if (!applicationsByPair.has(key)) {
          applicationsByPair.set(key, {
            id: idOf(application) || key,
            applicantId,
            jobId,
            applicationStatus: status(application.applicationStatus, 'pending'),
            applicationDate: application.applicationDate
              ? dateOf(application.applicationDate, 'job.applicants.applicationDate')
              : new Date(),
            sourceCollection: 'jobsmodels.applicants',
            sourceId: idOf(application) || key
          })
        }
      }
    }
    for (const application of applicationsByPair.values()) {
      await upsert(prisma.jobApplication, application.id, {
        applicantId: application.applicantId,
        jobId: application.jobId,
        address: null,
        resume: null,
        coverLetter: null,
        applicationStatus: application.applicationStatus,
        applicationDate: application.applicationDate,
        createdAt: application.applicationDate,
        updatedAt: new Date()
      })
      await writeCheckpoint(application.sourceCollection, application.sourceId, 'JobApplication', application.id)
    }
  const unlinkedApplications = await mongoose.connection.db
    .collection(mongoCollections.appforjobsmodel)
    .countDocuments()
  console.log('Migration finished. Legacy applyForJbs rows have no user/job references and were not imported:', unlinkedApplications)
  console.log('Imported records are tracked in PostgreSQL table LegacyImport. Re-running is idempotent by preserved source IDs.')
}

async function main() {
  if (!process.env.MONGODB_URL) throw new Error('MONGODB_URL is required for legacy source access.')
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error('DATABASE_URL and DIRECT_URL are required for PostgreSQL access.')
  }
  if (process.argv.includes('--execute')) return migrate()
  return audit()
}

main()
  .catch(error => {
    console.error('MongoDB to PostgreSQL migration failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
    await prisma.$disconnect()
  })
