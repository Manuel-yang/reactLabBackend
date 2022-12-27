var express = require('express');
var router = express.Router();
const data = require('../api/genres/genresData')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(data)
});

module.exports = router;
