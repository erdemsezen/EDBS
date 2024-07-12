const express = require('express');
const path = require('path');
const app = express();
const conn = require('./db_connection.js');
const bodyParser = require('body-parser');

conn.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());

app.get('/', async(req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

    conn.query("SELECT privilege FROM edbs.users WHERE username = ? AND pass = ?", 
      [username, password],
      function(err, results, fields) {
        if (err) {
          console.error(err);
          res.status(500).json({error: 'Internal Server Error'});
          return;
        }

        if (results.length > 0) {
          if (results[0].privilege == 1) {
            res.json({ home: "http://localhost:8080/admin"});
          }
        } else {
          res.status(401).send('Unauthorized'); // User does not exist or incorrect credentials
        } 
        
      }
  );
})

app.get('/admin', async(req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});





app.listen(8080, () => {
  console.log("Server successfully running on port 8080");
});
    