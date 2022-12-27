// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';
const mongoose = require("mongoose")
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema

const UserSchema = new Schema({
  username: { type: String, required: true},
  email: { type: String, require: true},
  password: {type: String, required: true },
  favourites: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movies'}],
  favGenres: [{id: Number, name: String}],
  avatar: {type: String, default: "https://i.328888.xyz/2022/12/27/UVdOp.jpeg"}
});

UserSchema.pre('save', function(next) {
  const user = this;
  if (this.isModified('password') || this.isNew) {
      bcrypt.genSalt(10, (err, salt)=> {
          if (err) {
              return next(err);
          }
          bcrypt.hash(user.password, salt, (err, hash)=> {
              if (err) {
                  return next(err);
              }
              console.log(hash)
              user.password = hash;
              console.log(user.password)
              next();
          });
      });
      next()
  } else {
      return next();
  }
});

UserSchema.statics.findByUserName = function (username) {
  return this.findOne({ username: username });
};

UserSchema.statics.findByUserId = function (id) {
  return this.findOne({ _id: id });
};

UserSchema.methods.comparePassword = function (passw, callback) {
  bcrypt.compare(passw, this.password, (err, isMatch) => {
    if(err) {
      return callback(err)
    }
    callback(null, isMatch);
  });
};

module.exports = mongoose.model("User", UserSchema);