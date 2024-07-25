const mysql = require('mysql2');
require('dotenv').config();

var conn = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
  multipleStatements: true
});

module.exports = conn;