const dotenv = require("dotenv")
const mongoose = require('mongoose')

dotenv.config();

// Connect to database
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_DB);
const db = mongoose.connection;

db.on('error', (err) => {
    console.log(`database connection error: ${err}`);
});
db.on('disconnected', () => {
    console.log('database disconnected');
});
db.once('open', () => {
    console.log(`database connected to ${db.name} on ${db.host}`);
})