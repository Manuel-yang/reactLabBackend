var express = require('express');
var router = express.Router();
const userMethod = require("../api/users/index")

/* GET home page. */
router.post('/userInfo', async function(req, res, next) {
  if(req.body.id && req.body.token) {
    const result = await userMethod.findUserById(req.body.id, req.body.token)
    res.send(result)
  }
    else {
      res.status(401).json({ code: 401, msg: 'Authentication failed. Invalid token' });
    }
  // const result = await userMethod.findUser()
  // res.send(result)
});

router.post('/', async function(req, res, next) {
  return await userMethod.register(req, res)
});

router.post('/:id', function(req, res, next) {
  return userMethod.updateUserInfo(req, res)
});

router.get('/:id', function(req, res, next) {
  return userMethod.findUserById(req, res)
});


module.exports = router;
