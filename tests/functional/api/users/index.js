import chai from "chai";
import request from "supertest";
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken')
import User from "../../../../api/users/userModel";
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
    beforeEach(async () => {
      try {
        // Register two users
        await request(api).get("/users")
        .then((response) => {
          user = response.body[0]
          token = jwt.sign(user.username, process.env.SECRET);
          id = user._id
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

    it("should return error when the id miss",  (done) => {
      request(api)
        .post("/users/userInfo")
        .send({token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the token miss",  (done) => {
      request(api)
        .post("/users/userInfo")
        .send({id: id})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect({ code: 401, msg: 'Authentication failed. Invalid token' })
          done()
        });
    });

    it("should return error when the id and token is not combine",  (done) => {
      request(api)
        .post("/users/userInfo")
        .send({id: "63b1ee9e9bf6aef1789f7328", token: token})
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect({code: 401,msg: 'Invalid token or user id'})
          done()
        });
    });
  });
})