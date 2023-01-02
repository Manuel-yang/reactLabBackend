import chai from "chai";
import request from "supertest";
const mongoose = require("mongoose");
const data = require('../../../../api/genres/genresData')
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

  describe("GET /genres ", () => {
    it("should return genres json", (done) => {
      request(api)
        .get("/genres")
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.be.a("object");
          expect(JSON.stringify(res.body)).equal(JSON.stringify(data))
          done();
        });
    });
  });
})