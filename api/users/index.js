const User = require("./userModel")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const auth = require("../auth/index")

const reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,}$/
const regMail = /^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$/;

// Get all users
exports.findUser = async (req, res) => {
  const users = await User.find();
  res.status(200).json(users)
}

exports.findUserById = async (req, res) => {
  const id = req.body.id
  const token = req.body.token
  const user = await User.findByUserId(id);
  if (user && auth.jwtVerify(token) == user.username) {
    return res.status(200).json({code: 200, user: user});
  }
  return res.status(401).json({code: 401,msg: 'Invalid token or user id'});
}

// register
exports.register = async (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(401).json({success: false, msg: 'Please pass username and password.'});
    return next();
  }
  if (req.query.action === 'register') {
    if(!regMail.test(req.body.email)) {
      return  res.status(401).json({code: 401,msg: 'Please input valid email address'});
    }
    if(reg.test(req.body.password)) {
      bcrypt.genSalt(10, (err, salt)=> {
        bcrypt.hash(req.body.password, salt, async (err, hash)=> {
            if (err) {
                return err;
            }
            req.body.password = hash;
            await User.create(req.body);
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
          return res.status(200).json({success: true, userId: user.id, token: token});
        } else {
          return res.status(401).json({code: 401,msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
} 

// Update a user
exports.updateUserInfo = async (req, res) => {
  const user = await User.findByUserId(req.body.id);
  if(auth.jwtVerify(req.body.token) == user.username) {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    if ( email &&!regMail.test(email)) {
      return res.status(403).json({code: 403, msg: "Invalid email address"});
    }
    if (password && !reg.test(password)) {
      return res.status(403).json({code: 403, msg: 'Password are at least 5 characters long and contain at least one number and one letter'});
    }

    if(username) {
      await User.updateOne({
        _id: req.body.id,
      }, {
        $set: {
          username: username
        }
      });
    }

    if(email) {
      await User.updateOne({
        _id: req.body.id,
      }, {
        $set: {
          email: email
        }
      });
    }

    if(password) {
      bcrypt.genSalt(10, (err, salt)=> {
        bcrypt.hash(req.body.password, salt, async (err, hash)=> {
            if (err) {
                return err;
            }
            await User.updateOne({
              _id: req.body.id,
            }, {
              $set: {
                password: hash
              }
            });
        });
    });
    }

    return res.status(200).json({code: 200, msg: 'Update successfully'});


  }
  return res.status(403).json({code: 403, msg: "Invalid token"});
}

exports.updateGenres = async (req, res) => {
  const user = await User.findByUserId(req.body.id);
  if(auth.jwtVerify(req.body.token) == user.username) {
    let newFavGenres = req.body.newFavGenres;
    if(newFavGenres) {
      await User.updateOne({
        _id: req.body.id,
      }, {
        $set: {
          favGenres: newFavGenres
        }
      });
      return res.status(200).json({code: 200, msg: 'Update successfully'});
    }
  }
  else {
    return res.status(403).json({code: 403, msg: "Invalid token"});
  }
}

exports.updateAvatar = async (req, res) => {
  const user = await User.findByUserId(req.body.id);
  if(auth.jwtVerify(req.body.token) == user.username) {
    let newAvatar = req.body.avatarUrl;
    if(newAvatar) {
      await User.updateOne({
        _id: req.body.id,
      }, {
        $set: {
          avatar: newAvatar
        }
      });
      return res.status(200).json({code: 200, msg: 'Update successfully'});
    }
  }
  else {
    return res.status(403).json({code: 403, msg: "Invalid token"});
  }
}

exports.updateFavMovies = async (req, res) => {
  const user = await User.findByUserId(req.body.id);
  if(auth.jwtVerify(req.body.token) == user.username) {
    let newFavMovieId = req.body.movieId
    let favouritesList = user.favourites
    const set = new Set(newFavMovieId.concat(favouritesList))
    const reuslt = Array.from(set)
    await User.updateOne({
      _id: req.body.id,
    }, {
      $set: {
        favourites: reuslt
      }
    });
    return res.status(200).json({code: 200, msg: 'Update successfully'});
  }
  else {
    return res.status(403).json({code: 403, msg: "Invalid token"});
  }
}


exports.resetFavGenres = async (req, res) => {
  const user = await User.findByUserId(req.body.id);
  if(auth.jwtVerify(req.body.token) == user.username) {
    await User.updateOne({
      _id: req.body.id,
    }, {
      $set: {
        favGenres: []
      }
    });
    return res.status(200).json({code: 200, msg: 'Update successfully'});
  }
  else {
    return res.status(403).json({code: 403, msg: "Invalid token"});
  }
}

