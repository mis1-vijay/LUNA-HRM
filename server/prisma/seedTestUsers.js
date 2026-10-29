require('dotenv').config()

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt')
const prisma = require('../Database/prisma')
const dotenv = require('dotenv')

const credentialsPath = path.resolve(__dirname, '../.env.test-users.local')
const testAccounts = [
  { role: 'ADMIN', email: 'luna-test-admin@example.test', name: 'Luna Test Admin' },
  { role: 'HR_MANAGER', email: 'luna-test-hr@example.test', name: 'Luna Test HR' },
  { role: 'DEPARTMENT_MANAGER', email: 'luna-test-manager@example.test', name: 'Luna Test Manager' },
  { role: 'EMPLOYEE', email: 'luna-test-employee@example.test', name: 'Luna Test Employee' },
  { role: 'APPLICANT', email: 'luna-test-applicant@example.test', name: 'Luna Test Applicant' }
]

function getCredentials() {
  if (fs.existsSync(credentialsPath)) {
    const stored = dotenv.parse(fs.readFileSync(credentialsPath))
    const credentials = Object.fromEntries(testAccounts.map(account => {
      const prefix = `LUNA_TEST_${account.role}`
      return [
        account.role,
        {
          email: stored[`${prefix}_EMAIL`],
          password: stored[`${prefix}_PASSWORD`]
        }
      ]
    }))
    if (Object.values(credentials).some(({ email, password }) => !email || !password)) {
      throw new Error('The local test-credentials file is incomplete; refusing to overwrite it.')
    }
    return credentials
  }

  const credentials = Object.fromEntries(testAccounts.map(account => [
    account.role,
    {
      email: account.email,
      password: crypto.randomBytes(32).toString('hex')
    }
  ]))
  const lines = testAccounts.flatMap(account => {
    const prefix = `LUNA_TEST_${account.role}`
    const credential = credentials[account.role]
    return [
      `${prefix}_EMAIL=${credential.email}`,
      `${prefix}_PASSWORD=${credential.password}`
    ]
  })

  fs.writeFileSync(credentialsPath, `${lines.join('\n')}\n`, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600
  })
  return credentials
}

async function main() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.')
  }

  const credentials = getCredentials()
  const passwordHashes = Object.fromEntries(await Promise.all(
    testAccounts.map(async account => [
      account.role,
      await bcrypt.hash(credentials[account.role].password, 12)
    ])
  ))

  await prisma.$transaction(async tx => {
    for (const account of testAccounts) {
      const existing = await tx.account.findUnique({
        where: { email: credentials[account.role].email },
        select: { role: true }
      })
      if (existing && existing.role !== account.role) {
        throw new Error(`The reserved test email for ${account.role} is already assigned to another role.`)
      }
    }

    const department = await tx.department.upsert({
      where: { departmentCode: 'LUNA-TEST' },
      update: { departmentName: 'Luna HRM Test Department' },
      create: {
        departmentCode: 'LUNA-TEST',
        departmentName: 'Luna HRM Test Department'
      }
    })
    const designation = await tx.designation.upsert({
      where: { designationCode: 'LUNA-TEST-EMP' },
      update: { designationName: 'Luna HRM Test Employee', departmentId: department.id },
      create: {
        designationCode: 'LUNA-TEST-EMP',
        designationName: 'Luna HRM Test Employee',
        departmentId: department.id
      }
    })

    const accounts = {}
    for (const account of testAccounts) {
      const departmentId = ['HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'].includes(account.role)
        ? department.id
        : null
      accounts[account.role] = await tx.account.upsert({
        where: { email: credentials[account.role].email },
        update: {
          name: account.name,
          role: account.role,
          status: 'ACTIVE',
          departmentId,
          passwordHash: passwordHashes[account.role]
        },
        create: {
          email: credentials[account.role].email,
          name: account.name,
          firstName: account.name.split(' ').at(-1),
          lastName: 'Test',
          role: account.role,
          status: 'ACTIVE',
          departmentId,
          passwordHash: passwordHashes[account.role]
        }
      })
    }

    await tx.department.update({
      where: { id: department.id },
      data: { managerAccountId: accounts.DEPARTMENT_MANAGER.id }
    })
    await tx.employee.upsert({
      where: { employeeId: 'LUNA-TEST-EMPLOYEE' },
      update: {
        accountId: accounts.EMPLOYEE.id,
        firstName: 'Luna',
        lastName: 'Test Employee',
        email: credentials.EMPLOYEE.email,
        phone: '+10000000000',
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
        gender: 'OTHER',
        departmentId: department.id,
        designationId: designation.id,
        salary: '50000.00'
      },
      create: {
        employeeId: 'LUNA-TEST-EMPLOYEE',
        accountId: accounts.EMPLOYEE.id,
        firstName: 'Luna',
        lastName: 'Test Employee',
        email: credentials.EMPLOYEE.email,
        phone: '+10000000000',
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
        gender: 'OTHER',
        departmentId: department.id,
        designationId: designation.id,
        joinDate: new Date(),
        salary: '50000.00'
      }
    })
    await tx.applicant.upsert({
      where: { accountId: accounts.APPLICANT.id },
      update: {
        currentJob: 'Test Applicant',
        jobDescription: 'Luna HRM test account',
        qualification: 'Test',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+10000000000'
      },
      create: {
        accountId: accounts.APPLICANT.id,
        currentJob: 'Test Applicant',
        jobDescription: 'Luna HRM test account',
        qualification: 'Test',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+10000000000'
      }
    })
  })

  console.log('Created one active test account per role.')
  console.log(`Generated credentials are stored in ${credentialsPath}`)
}

main()
  .catch(error => {
    console.error('Test-account seed failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
