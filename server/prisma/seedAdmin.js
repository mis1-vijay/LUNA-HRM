require('dotenv').config()

const bcrypt = require('bcrypt')
const prisma = require('../Database/prisma')

async function main() {
  const name = process.env.SEED_ADMIN_NAME?.trim()
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!name || !email || !password) {
    throw new Error('SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD are required.')
  }
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.$transaction(async transaction => {
    const adminCount = await transaction.account.count({ where: { role: 'ADMIN' } })
    if (adminCount > 0) {
      throw new Error('An admin account already exists; refusing to seed another.')
    }

    const existingAccount = await transaction.account.findUnique({
      where: { email },
      select: { id: true }
    })
    if (existingAccount) {
      throw new Error('An account with SEED_ADMIN_EMAIL already exists; refusing to change its role.')
    }

    await transaction.account.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        role: 'ADMIN',
        passwordHash,
        status: 'ACTIVE'
      }
    })
  }, {
    isolationLevel: 'Serializable'
  })

  console.log(`Admin account for ${name} created successfully`)
}

main()
  .catch(error => {
    console.error('Admin seed failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
