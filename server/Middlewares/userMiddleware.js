const { verifyToken, authorizeRoles } = require('./adminMiddleware')

module.exports = verifyToken
module.exports.verifyToken = verifyToken
module.exports.authorizeRoles = authorizeRoles
