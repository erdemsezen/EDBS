/*
TODO:
+ View backup requests from DB
- Make requests from make request page
- View periodic requests from DB
- Implement automatic periodic requests algorithm
- View logs from DB in see logs menu
- Implement DELETE and VIEW buttons
- Implement take backup button
- Take username, position, profile picture and location from DB (for side panel)
- Implement algorithm for placeholder profile picture
- Disable browser back button
- Implement user page
*/


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

app.post('/admin', (req, res) => {
    conn.query("SELECT r.message, r.requestDate, s.location, r.status FROM edbs.requests r JOIN edbs.servers s ON r.serverID = s.serverID", 
    (err, results, fields) => {
      if (err) {
          console.error('Error querying MySQL:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      res.json(results); // Send JSON response with backup requests data
  });
}); 



app.listen(8080, () => {
  console.log("Server successfully running on port 8080");
});
