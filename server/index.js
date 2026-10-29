require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const prisma = require('./Database/prisma')
const connectToDB = require('./Database/db')
const userRouter = require('./Routes/userRoutes')
const adminRouter = require('./Routes/adminRoutes')
const employeeRouter = require('./Routes/employeeRoutes')
const dashboardRouter = require('./Routes/dashboardRoutes')
const departmentRouter = require('./Routes/departmentRoutes')
const designationRouter = require('./Routes/designationRoutes')
const attendanceRouter = require('./Routes/attendanceRoutes')
const leaveRouter = require('./Routes/leaveRoutes')
const salaryRouter = require('./Routes/salaryRoutes')
const performanceRouter = require('./Routes/performanceRoutes')

const app = express()
app.disable('x-powered-by')

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Origin is not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.send('Luna HRM API')
})

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.status(200).json({
      status: 'healthy',
      service: 'Luna HRM Backend',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      service: 'Luna HRM Backend',
      database: 'unavailable'
    })
  }
})

app.use('/api/v1', userRouter)
app.use('/api/v1', adminRouter)
app.use('/api/v1', employeeRouter)
app.use('/api/v1', dashboardRouter)
app.use('/api/v1', departmentRouter)
app.use('/api/v1', designationRouter)
app.use('/api/v1', attendanceRouter)
app.use('/api/v1', leaveRouter)
app.use('/api/v1', salaryRouter)
app.use('/api/v1', performanceRouter)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  console.error('Request failed:', error.message)
  return res.status(500).json({ success: false, message: 'Internal server error.' })
})

const start = async () => {
  await connectToDB()
  const port = Number(process.env.PORT || 5000)
  const server = app.listen(port, () => {
    console.log(`Luna HRM API listening on port ${port}`)
  })

  const shutdown = async signal => {
    server.close(async () => {
      await prisma.$disconnect()
      if (signal) process.exit(0)
    })
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

if (require.main === module) {
  start().catch(async error => {
    console.error('Server startup failed:', error.message)
    await prisma.$disconnect()
    process.exitCode = 1
  })
}

module.exports = app
