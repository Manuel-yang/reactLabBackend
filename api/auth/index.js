const jwt = require('jsonwebtoken')

exports.jwtVerify = (token) => {
  let result
  jwt.verify(token, process.env.SECRET, function(err, decoded) {
    if (err) {
      console.log("verify error: ", err)
      result =  false
    }
    result = decoded
  })
  return result
}