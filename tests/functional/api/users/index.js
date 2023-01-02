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
        email: "asdfasd@gmail.com",
        password: "test1",
      });
      await request(api).post("/users?action=register").send({
        username: "user2",
        email: "asdfaghjfjfghsd@gmail.com",
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
        .then((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.username).equal("user3")

        });
        request(api)
        .post("/users/updateInfo")
        .send({id: id, token: token, username: user.username})
        .end(() => {
          done();
        })

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
        .then((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.email).equal("test@gmail.com")
        });
        request(api)
        .post("/users/updateInfo")
        .send({id: id, token: token, email: user.email})
        .end(() => {
          done();
        })
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
        bcrypt.genSalt(10, (err, salt)=> {
          if (err) {
              return err;
          }
          bcrypt.hash("yangyimeng2", salt, async (err, hash)=> {
            request(api)
            .post("/users/userInfo")
            .send({id: id, token: token})
            .expect("Content-Type", /json/)
            .expect(200)
            .then((err, res) => {
              expect(res.body).to.be.a("object")
              expect(res.body.user.password).equal(hash)
            });
          });
      });

        request(api)
        .post("/users/updateInfo")
        .send({id: id, token: token, password: user.password})
        .end(() => {
          done();
        })
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
        .then((err, res) => {
          expect(res.body).to.be.a("object")
          expect(res.body.user.favGenres[0].id).equal(1)
          expect(res.body.user.favGenres[0].name).equal("Action")
        });
        request(api)
        .post("/users/userInfo")
        .send({id: id, token: token, newFavGenres: []})
        .end(() => {
          done();
        })
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
})