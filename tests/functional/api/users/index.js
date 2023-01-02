import chai from "chai";
import request from "supertest";
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
import api from "../../../../app";

const expect = chai.expect;
let db;

describe("Users endpoint", () => {
  before(() => {
    mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = mongoose.connection;
  });

  beforeEach(async () => {
    try {
      // Register two users
      await request(api).post("/users?action=register").send({
        username: "user1",
        email: "test1@gmail.com",
        password: "test1",
      });
      await request(api).post("/users?action=register").send({
        username: "user2",
        email: "test2@gmail.com",
        password: "test2",
      });
    } catch (err) {
      console.error(`failed to Load user test Data: ${err}`);
    }
  });

  
  describe("GET /users ", () => {
    it("should return the 2 users and a status 200", (done) => {
      request(api)
        .get("/users")
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("array");
          expect(res.body.length).to.equal(2);
          let result = res.body.map((user) => user.username);
          expect(result).to.have.members(["user1", "user2"]);
          done();
        });
    });
  });

  describe("POST /users/userInfo ", () => {
    let user;
    let token
    let id
    let id2
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
          id2 = response.body[1]._id
        })
      } catch (err) {
        console.error(`failed to Load user test Data: ${err}`);
      }
    });
    
    it("should return user info and status code 200",  (done) => {
      request(api)
        .post("/users/userInfo")
        .send({id: id, token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object");
          expect(res.body.user._id).to.equal(id)
          done();
        });
    });

    it("should return error when the id missing",  (done) => {
      request(api)
        .post("/users/userInfo")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token missing",  (done) => {
      request(api)
        .post("/users/userInfo")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combination",  (done) => {
      request(api)
        .post("/users/userInfo")
        .send({id: id2, token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({code: 401,msg: 'Invalid token or user id'})
          done()
        });
    });
  });

  describe("POST /users/updateInfo ", () => {
    let user;
    let token
    let id
    let id2
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
          id2 = response.body[1]._id
        })
      } catch (err) {
        console.error(`failed to Load user test Data: ${err}`);
      }
    });

    it("username should be changed after updating", (done) => {
      request(api)
      .post("/users/updateInfo")
      .send({id: id, token: token, username: "user3"})
      .expect("Content-Type", /json/)
      .expect(200)
      .then((err, res) => {
        expect({code: 200, msg: 'Update successfully'})
        token = jwt.sign("user3", process.env.SECRET);
        request(api)
        .post("/users/userInfo")
        .send({id: id, token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.username).equal("user3")
          request(api)
          .post("/users/updateInfo")
          .send({id: id, token: token, username: user.username})
          .end(() => {
            done();
          })
        });
      });
    })

    it("email should be changed after updating", (done) => {
      request(api)
      .post("/users/updateInfo")
      .send({id: id, token: token, email: "test@gmail.com"})
      .expect("Content-Type", /json/)
      .expect(200)
      .then((err, res) => {
        expect({code: 200, msg: 'Update successfully'})
        request(api)
        .post("/users/userInfo")
        .send({id: id, token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.email).equal("test@gmail.com")
          request(api)
          .post("/users/updateInfo")
          .send({id: id, token: token, email: user.email})
          .end(() => {
            done();
          })
        });
      });
    })

    it("password should be changed after updating", (done) => {
      request(api)
      .post("/users/updateInfo")
      .send({id: id, token: token, password: "yangyimeng2"})
      .expect("Content-Type", /json/)
      .expect(200)
      .then((err, res) => {
        expect({code: 200, msg: 'Update successfully'})
          request(api)
          .post("/users/userInfo")
          .send({id: id, token: token})
          .expect("Content-Type", /json/)
          .expect(200)
          .end((err, res) => {
            expect(res.body).to.be.a("object")
            bcrypt.compare("yangyimeng2", res.body.user.password, async (err, isMatch) => {
              if(err) {
                return callback(err)
              }
              await expect(isMatch).is.true
            });
            request(api)
            .post("/users/updateInfo")
            .send({id: id, token: token, password: "test2"})
            .end(() => {
              done();
            })
          });


      });
    })

    it("should return error when the email address is invalid", (done) => {
      request(api)
      .post("/users/updateInfo")
      .send({id: id, token: token, email: "test@"})
      .expect("Content-Type", /json/)
      .expect(403)
      .end(() => {
        expect({code: 403, msg: "Invalid email address"})
        done()
      })
    })

    it("should return error when the password is invalid", (done) => {
      request(api)
      .post("/users/updateInfo")
      .send({id: id, token: token, password: "tes"})
      .expect("Content-Type", /json/)
      .expect(403)
      .end(() => {
        expect({code: 403, msg: 'Password are at least 5 characters long and contain at least one number and one letter'})
        done()
      })
    })

    it("should return error when the id missing",  (done) => {
      request(api)
        .post("/users/updateInfo")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token missing",  (done) => {
      request(api)
        .post("/users/updateInfo")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combination",  (done) => {
      request(api)
        .post("/users/updateInfo")
        .send({id: id2, token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({code: 401,msg: 'Invalid token or user id'})
          done()
        });
    });
  })

  describe("POST /users/updateGenres ", () => {
    let user;
    let token
    let id
    let id2
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
          id2 = response.body[1]._id
        })
      } catch (err) {
        console.error(`failed to Load user test Data: ${err}`);
      }
    });


    it("should udpate user favourite genres after updaing", (done) => {
      request(api)
      .post("/users/updateGenres")
      .send({id: id, token: token, newFavGenres: [{id: "1", name: "Action"}]})
      .expect("Content-Type", /json/)
      .expect(200)
      .then(() => {
        expect({code: 200, msg: 'Update successfully'})
        request(api)
        .post("/users/userInfo")
        .send({id: id, token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.favGenres[0].id).equal(1)
          expect(res.body.user.favGenres[0].name).equal("Action")
          request(api)
          .post("/users/updateGenres")
          .send({id: id, token: token, newFavGenres: []})
          .end(() => {
            done();
          })
        });
      });
    })

    it("should return error when the id missing",  (done) => {
      request(api)
        .post("/users/updateGenres")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token missing",  (done) => {
      request(api)
        .post("/users/updateGenres")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combination",  (done) => {
      request(api)
        .post("/users/updateGenres")
        .send({id: id2, token: token})
        .expect("Content-Type", /json/)
        .expect(403)
        .end(() => {
          expect({code: 403, msg: "Invalid token"})
          done()
        });
    });
  })

  describe("POST /users/updateAvatar ", () => {
    let user;
    let token
    let id
    let id2
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
          id2 = response.body[1]._id
        })
      } catch (err) {
        console.error(`failed to Load user test Data: ${err}`);
      }
    });

    it("should udpate user avatar url after updaing", (done) => {
      request(api)
      .post("/users/updateAvatar")
      .send({id: id, token: token, avatarUrl: "test"})
      .expect("Content-Type", /json/)
      .expect(200)
      .then(() => {
        expect({code: 200, msg: 'Update successfully'})
        request(api)
        .post("/users/userInfo")
        .send({id: id, token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.avatar).equal("test")
          request(api)
          .post("/users/updateAvatar")
          .send({id: id, token: token, avatarUrl: user.avatar})
          .end(() => {
            done();
          })
        });

      });
    })

    it("should return error when the id missing",  (done) => {
      request(api)
        .post("/users/updateAvatar")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token missing",  (done) => {
      request(api)
        .post("/users/updateAvatar")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combination",  (done) => {
      request(api)
        .post("/users/updateAvatar")
        .send({id: id2, token: token})
        .expect("Content-Type", /json/)
        .expect(403)
        .end(() => {
          expect({code: 403, msg: "Invalid token"})
          done()
        });
    });
  })


  describe("POST /users/updateFavMovies ", () => {
    let user;
    let token
    let id
    let id2
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
          id2 = response.body[1]._id
        })
      } catch (err) {
        console.error(`failed to Load user test Data: ${err}`);
      }
    });
    
    it("should udpate user favourite movies after updaing", (done) => {
      request(api)
      .post("/users/updateFavMovies")
      .send({id: id, token: token, movieId: [1]})
      .expect("Content-Type", /json/)
      .expect(200)
      .then(() => {
        expect({code: 200, msg: 'Update successfully'})
        request(api)
        .post("/users/userInfo")
        .send({id: id, token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.favourites[0]).equal(1)
          request(api)
          .post("/users/updateFavMovies")
          .send({id: id, token: token, movieId: []})
          .end(() => {
            done();
          })
        });
      });
    })

    it("should return error when the id missing",  (done) => {
      request(api)
        .post("/users/updateFavMovies")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token missing",  (done) => {
      request(api)
        .post("/users/updateFavMovies")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combination",  (done) => {
      request(api)
        .post("/users/updateFavMovies")
        .send({id: id2, token: token})
        .expect("Content-Type", /json/)
        .expect(403)
        .end(() => {
          expect({code: 403, msg: "Invalid token"})
          done()
        });
    });
  })

  describe("POST /users/resetFavGenres ", () => {
    let user;
    let token
    let id
    let id2
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
          id2 = response.body[1]._id
        })
      } catch (err) {
        console.error(`failed to Load user test Data: ${err}`);
      }
    });

    it("favourite should be empty after reseting", (done) => {
      request(api)
      .post("/users/updateGenres")
      .send({id: id, token: token, newFavGenres: [{id: "1", name: "Action"}]})
      .expect("Content-Type", /json/)
      .expect(200)
      .then(() => {
        expect({code: 200, msg: 'Update successfully'})
        request(api)
        .post("/users/userInfo")
        .send({id: id, token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.favGenres[0].id).equal(1)
          expect(res.body.user.favGenres[0].name).equal("Action")
          request(api)
          .post("/users/resetFavGenres")
          .send({id: id, token: token})
          .then(() => {
            request(api)
            .post("/users/userInfo")
            .send({id: id, token: token})
            .end((err, res) => {
              expect(res.body.user.favGenres).to.be.empty
              done()
            })
          })
        });
      });
    })

    it("should return error when the id missing",  (done) => {
      request(api)
        .post("/users/resetFavGenres")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token missing",  (done) => {
      request(api)
        .post("/users/resetFavGenres")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combination",  (done) => {
      request(api)
        .post("/users/resetFavGenres")
        .send({id: id2, token: token})
        .expect("Content-Type", /json/)
        .expect(403)
        .end(() => {
          expect({code: 403, msg: "Invalid token"})
          done()
        });
    });
  })

  describe("POST /users ", () => {
    let user;
    let token
    let id
    let id2
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
          id2 = response.body[1]._id
        })
      } catch (err) {
        console.error(`failed to Load user test Data: ${err}`);
      }
    });

    it("should return user id and user token", (done) => {
      request(api)
        .post("/users")
        .send({username: user.username, password: "test2"})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object");
          expect(res.body.token).equal(token)
          expect(res.body.userId).equal(id)
          done();
        });
    });

    it("should return error when user doesn't exist", (done) => {
      request(api)
        .post("/users")
        .send({username: "test", password: "test2"})
        .expect("Content-Type", /json/)
        .expect(401)
        .end((err, res) => {
          expect({ code: 401, msg: 'Authentication failed. User not found.' })
          done();
        });
    });

    it("should return error when username is missing", (done) => {
      request(api)
        .post("/users")
        .send({ password: "test2"})
        .expect("Content-Type", /json/)
        .expect(401)
        .end((err, res) => {
          expect({success: false, msg: 'Please pass username and password.'})
          done();
        });
    });

    it("should return error when password is missing", (done) => {
      request(api)
        .post("/users")
        .send({ username: "test2"})
        .expect("Content-Type", /json/)
        .expect(401)
        .end((err, res) => {
          expect({success: false, msg: 'Please pass username and password.'})
          done();
        });
    });
  
    it("should return error when password is invalid", (done) => {
      request(api)
        .post("/users?action=register")
        .send({ username: "test6", email: "test6@gmail.com", password: "asd"})
        .expect("Content-Type", /json/)
        .expect(401)
        .end((err, res) => {
          expect({code: 401,msg: 'Password are at least 5 characters long and contain at least one number and one letter'})
          done();
        });
    });

    // it("should return 201 when register successfully", (done) => {
    //   request(api)
    //     .post("/users?action=register")
    //     .send({ username: "test7",email: "test7@gmail.com", password: "yangyimeng1"})
    //     .expect("Content-Type", /json/)
    //     .expect(201)
    //     .end((err, res) => {
    //       expect({code: 201, msg: 'Successful created new user.'})
    //       done();
    //     });
    // });

    it("should return 401 when input wrong password", (done) => {
      request(api)
        .post("/users")
        .send({ username: "user2", password: "yangyimeng6"})
        .expect("Content-Type", /json/)
        .expect(401)
        .end((err, res) => {
          expect({code: 401,msg: 'Authentication failed. Wrong password.'})
          done();
        });
    });

    it("should return error when the id missing",  (done) => {
      request(api)
        .post("/users/resetFavGenres")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token missing",  (done) => {
      request(api)
        .post("/users/resetFavGenres")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(401)
        .end(() => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combination",  (done) => {
      request(api)
        .post("/users/resetFavGenres")
        .send({id: id2, token: token})
        .expect("Content-Type", /json/)
        .expect(403)
        .end(() => {
          expect({code: 403, msg: "Invalid token"})
          done()
        });
    });
  });
})