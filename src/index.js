/*
TODO:
+ View backup requests from DB
- Make requests from make request page
+ View periodic requests from DB
- Implement automatic periodic requests algorithm
- View logs from DB in see logs menu
- Implement DELETE and VIEW buttons
- Implement take backup button
+ Take username, position, profile picture and location from DB (for side panel)
+ Implement algorithm for placeholder profile picture
+ Disable browser back button
- Implement user page
*/


const express = require('express');
const path = require('path');
const app = express();
const conn = require('./db_connection.js');
const jwt = require('jsonwebtoken');
const nocache = require("nocache");
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
let currentUser = "";


function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if(!token){
    return res.status(401).json({ error : 'Access denied. No token provided.'});
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch(error){
    res.status(401).json({ error : 'Invalid token' });
  }
};

conn.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(express.static(path.join(__dirname, '../public')));
// app.use(bodyParser.json());
app.use(express.json());
app.use(nocache());

app.get('/', async(req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

    conn.query("SELECT * FROM edbs.users WHERE username = ? AND pass = ?", 
      [username, password],
      function(err, results, fields) {
        if (err) {
          console.error(err);
          res.status(500).json({error: 'Internal Server Error'});
          return;
        }

        if (results.length > 0) {
          const user = results[0];
          currentUser = user.username;
          if (user.privilege == 1) {
            const token = jwt.sign({
              username: user.username,
              route: "/admin"
            }, jwtSecret, {expiresIn: '24h'});
            res.json({token});
          } else {
            const token = jwt.sign({
              username: user.username,
              route: "/home"
            }, jwtSecret, {expiresIn: '24h'});
            res.json({token});
          }
        } else {
          res.status(401).send('Unauthorized'); // User does not exist or incorrect credentials
        } 
        
      }
  );
});

app.get('/admin', async(req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/getJWTData', verifyToken, (req, res) => {
  res.json({user: req.user});
});

app.post('/admin/backupTable', verifyToken, (req, res) => {
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

app.post('/admin/profile', (req, res) => {
  conn.query("SELECT u.firstName, u.lastName, u.position, u.imagePath, s.location FROM edbs.users u JOIN edbs.servers s ON u.serverID = s.serverID WHERE u.username = ?",
    [currentUser], 
    (err, results, fields) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results);
  });
});


app.listen(process.env.PORT, () => {
  console.log("Server successfully running");
});
