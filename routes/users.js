var express = require('express');
var router = express.Router();
const userMethod = require("../api/users/index")

/* GET home page. */
router.post('/userInfo', async function(req, res, next) {
  if(req.body.id && req.body.token) {
    return await userMethod.findUserById(req, res)
  }
    else {
      res.status(401).json({ code: 401, msg: 'Authentication failed. Invalid token' });
    }
  // const result = await userMethod.findUser()
  // res.send(result)
});

router.post("/updateInfo", async function(req, res) {
  if(req.body.id && req.body.token) {
    return await userMethod.updateUserInfo(req, res)
  }
  else {
    res.status(401).json({ code: 401, msg: 'Authentication failed. Invalid token' });
  }
})

router.post("/updateGenres", async function(req, res) {
  if(req.body.id && req.body.token) {
    return await userMethod.updateGenres(req, res)
  }
  else {
    res.status(401).json({ code: 401, msg: 'Authentication failed. Invalid token' });
  }
})

router.post("/updateAvatar", async function(req, res) {
  if(req.body.id && req.body.token) {
    return await userMethod.updateAvatar(req, res)
  }
  else {
    res.status(401).json({ code: 401, msg: 'Authentication failed. Invalid token' });
  }
}) 

router.post("/updateFavMovies", async function(req, res) {
  if(req.body.id && req.body.token) {
    return await userMethod.updateFavMovies(req, res)
  }
  else {
    res.status(401).json({ code: 401, msg: 'Authentication failed. Invalid token' });
  }
}) 

router.post("/resetFavGenres", async function(req, res) {
  if(req.body.id && req.body.token) {
    return await userMethod.resetFavGenres(req, res)
  }
  else {
    res.status(401).json({ code: 401, msg: 'Authentication failed. Invalid token' });
  }
}) 


router.post('/', async function(req, res, next) {
  return await userMethod.register(req, res)
});

router.post('/:id', function(req, res, next) {
  return userMethod.updateUserInfo(req, res)
});

router.get('/', function(req, res, next) {
  return userMethod.findUser(req, res)
});


module.exports = router;
