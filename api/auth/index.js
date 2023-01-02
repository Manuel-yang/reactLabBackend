const jwt = require('jsonwebtoken')

exports.jwtVerify = (token) => {
  let result
  jwt.verify(token, process.env.SECRET, function(err, decoded) {
    result = decoded
  })
  return result
}