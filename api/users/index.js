const User = require("./userModel")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

// Get all users
exports.findUser = async () => {
  const users = await User.find();
  return users
}

// register
exports.register = async (req, res) => {
  console.log(req.query.action)
  if (!req.body.username || !req.body.password) {
    res.status(401).json({success: false, msg: 'Please pass username and password.'});
    return next();
  }
  if (req.query.action === 'register') {
    const reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,}$/
    const regMail = /^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$/;
    if(!regMail.test(req.body.email)) {
      return  res.status(401).json({code: 401,msg: 'Please input valid email address'});
    }
    if(reg.test(req.body.password)) {
      bcrypt.genSalt(10, (err, salt)=> {
        if (err) {
            return err;
        }
        bcrypt.hash(req.body.password, salt, async (err, hash)=> {
            if (err) {
                return err;
            }
            req.body.password = hash;
            await User.create(req.body);
            console.log(req.body)
        });
    });
      
      return res.status(201).json({code: 201, msg: 'Successful created new user.'});
    }
    else {
      return res.status(401).json({code: 401,msg: 'Password are at least 5 characters long and contain at least one number and one letter'});
    }

  } else {
    const user = await User.findByUserName(req.body.username);
      if (!user) return res.status(401).json({ code: 401, msg: 'Authentication failed. User not found.' });
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          // if user is found and password matches, create a token
          const token = jwt.sign(user.username, process.env.SECRET);
          // return the information including token as JSON
          return res.status(200).json({success: true, token: 'BEARER ' + token});
        } else {
          return res.status(401).json({code: 401,msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
} 

// Update a user
exports.updateUserInfo = async (req, res) => {
  if (req.body._id) delete req.body.id;
  const result = await User.updateOne({
    _id: req.params.id,
  }, req.body);
  if (result.matchedCount) {
    return res.status(200).json({ code:200, msg: 'User Updated Sucessfully' });
  } else {
    return res.status(404).json({ code: 404, msg: 'Unable to Update User' });
  }
}




