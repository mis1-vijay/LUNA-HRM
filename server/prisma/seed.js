require('dotenv').config()

const bcrypt = require('bcrypt')
const prisma = require('../Database/prisma')

const departments = [
  { departmentCode: 'HR', departmentName: 'Human Resources' },
  { departmentCode: 'ENG', departmentName: 'Engineering' },
  { departmentCode: 'OPS', departmentName: 'Operations' }
]

async function seedOptionalAccount({ prefix, role, departmentId }) {
  const email = process.env[`${prefix}_EMAIL`]
  const password = process.env[`${prefix}_PASSWORD`]
  const name = process.env[`${prefix}_NAME`]

  if (!email && !password && !name) return
  if (!email || !password || !name) {
    throw new Error(`${prefix}_EMAIL, ${prefix}_PASSWORD, and ${prefix}_NAME must all be set`)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const account = await prisma.account.upsert({
    where: { email: email.toLowerCase() },
    update: { name, role, status: 'ACTIVE', departmentId, passwordHash },
    create: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role,
      status: 'ACTIVE',
      departmentId
    }
  })
  return account
}

async function seedOptionalEmployee(departmentId, designationId) {
  const keys = ['EMAIL', 'PASSWORD', 'EMPLOYEE_ID', 'FIRST_NAME', 'LAST_NAME', 'PHONE', 'DATE_OF_BIRTH', 'GENDER', 'SALARY']
  const values = Object.fromEntries(keys.map(key => [
    key,
    process.env[`SEED_EMPLOYEE_${key}`]
  ]))
  if (Object.values(values).every(value => !value)) return
  if (Object.values(values).some(value => !value)) {
    throw new Error(`SEED_EMPLOYEE_${keys.join(', SEED_EMPLOYEE_')} must all be set to seed an employee`)
  }

  const email = values.EMAIL.toLowerCase()
  const account = await prisma.account.upsert({
    where: { email },
    update: {
      name: `${values.FIRST_NAME} ${values.LAST_NAME}`,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId,
      passwordHash: await bcrypt.hash(values.PASSWORD, 12)
    },
    create: {
      email,
      name: `${values.FIRST_NAME} ${values.LAST_NAME}`,
      firstName: values.FIRST_NAME,
      lastName: values.LAST_NAME,
      passwordHash: await bcrypt.hash(values.PASSWORD, 12),
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId
    }
  })
  await prisma.employee.upsert({
    where: { employeeId: values.EMPLOYEE_ID },
    update: {
      accountId: account.id,
      firstName: values.FIRST_NAME,
      lastName: values.LAST_NAME,
      email,
      phone: values.PHONE,
      dateOfBirth: new Date(values.DATE_OF_BIRTH),
      gender: values.GENDER.toUpperCase(),
      departmentId,
      designationId,
      salary: values.SALARY
    },
    create: {
      employeeId: values.EMPLOYEE_ID,
      accountId: account.id,
      firstName: values.FIRST_NAME,
      lastName: values.LAST_NAME,
      email,
      phone: values.PHONE,
      dateOfBirth: new Date(values.DATE_OF_BIRTH),
      gender: values.GENDER.toUpperCase(),
      departmentId,
      designationId,
      joinDate: new Date(),
      salary: values.SALARY
    }
  })
}

async function main() {
  const createdDepartments = {}
  for (const department of departments) {
    createdDepartments[department.departmentCode] = await prisma.department.upsert({
      where: { departmentCode: department.departmentCode },
      update: {},
      create: department
    })
  }

  const designations = [
    { designationCode: 'HR-MGR', designationName: 'HR Manager', departmentId: createdDepartments.HR.id },
    { designationCode: 'ENG-MGR', designationName: 'Engineering Manager', departmentId: createdDepartments.ENG.id },
    { designationCode: 'ENG-DEV', designationName: 'Software Developer', departmentId: createdDepartments.ENG.id },
    { designationCode: 'OPS-MGR', designationName: 'Operations Manager', departmentId: createdDepartments.OPS.id }
  ]

  for (const designation of designations) {
    await prisma.designation.upsert({
      where: { designationCode: designation.designationCode },
      update: {},
      create: designation
    })
  }
  const engineerDesignation = await prisma.designation.findUnique({
    where: { designationCode: 'ENG-DEV' },
    select: { id: true }
  })

  await seedOptionalAccount({
    prefix: 'SEED_ADMIN',
    role: 'ADMIN',
    departmentId: null
  })
  await seedOptionalAccount({
    prefix: 'SEED_HR',
    role: 'HR_MANAGER',
    departmentId: createdDepartments.HR.id
  })
  const manager = await seedOptionalAccount({
    prefix: 'SEED_MANAGER',
    role: 'DEPARTMENT_MANAGER',
    departmentId: createdDepartments.ENG.id
  })
  if (manager) {
    await prisma.department.update({
      where: { id: createdDepartments.ENG.id },
      data: { managerAccountId: manager.id }
    })
  }
  await seedOptionalEmployee(createdDepartments.ENG.id, engineerDesignation.id)

  console.log('Seed completed: departments, designations, and configured accounts.')
}

main()
  .catch(error => {
    console.error('Prisma seed failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
