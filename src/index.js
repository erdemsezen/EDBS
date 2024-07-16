/*
TODO:
+ View backup requests from DB
- Make requests from make request page
+ View periodic requests from DB
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

app.post('/admin/backupTable', (req, res) => {
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

app.post('/admin/periodicRequests', (req, res) => {
  conn.query("SELECT r.message, s.location, r.period, r.requestDate AS nextDate FROM edbs.requests r JOIN edbs.servers s ON r.serverID = s.serverID WHERE r.period != 'None';", 
    (err, results, fields) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    const today = new Date().toISOString().split("T")[0];

    results.forEach(result => {
      result.nextDate.setDate(result.nextDate.getDate() + 1);

      switch (result.period) {
        case 'Day':
          result.nextDate.setDate(result.nextDate.getDate() + 1);
          // if(result.nextDate.split("T")[0] == today) {
          //   result.nextDate.setDate(result.nextDate.getDate() + 1);
          //   conn.query("INSERT INTO Requests (message, requestDate, status, period, serverID) VALUES (?, ?, ?, ?, ?)",
          //     [result.message, today, "Not Completed", result.period, result.serverID]
          //   )
          // };
          break;
        case 'Week':
          result.nextDate.setDate(result.nextDate.getDate() + 7);
          break;
        case 'Month':
          result.nextDate.setMonth(result.nextDate.getMonth() + 1);
          break;
        case 'Year':
          result.nextDate.setFullYear(result.nextDate.getFullYear() + 1);
          break;
        default:
          // Handle unexpected period (though should not occur as per query WHERE clause)
          break;
      }

    })

    res.json(results); // Send JSON response with backup requests data
  });
});


app.listen(8080, () => {
  console.log("Server successfully running on port 8080");
});
