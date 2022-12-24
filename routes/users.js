var express = require('express');
var router = express.Router();
const userMethod = require("../api/users/index")

/* GET home page. */
router.get('/', async function(req, res, next) {
  const result = await userMethod.findUser()
  res.send(result)
});

router.post('/', async function(req, res, next) {
  const result = await userMethod.register(req, res)
  if (result) {
    res.send(result)
  }
});

router.post('/:id', function(req, res, next) {
  return userMethod.updateUserInfo(req, res)
});


module.exports = router;
