const prisma = require('./prisma')

const connectToDB = async () => {
  await prisma.$connect()
  await prisma.$queryRaw`SELECT 1`
  console.log('Connected to PostgreSQL successfully.')
}

module.exports = connectToDB