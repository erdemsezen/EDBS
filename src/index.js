const mysql = require('mysql');
const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "rootROOT"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', async(req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(8080, () => {
  console.log("Server successfully running on port 8080");
});
