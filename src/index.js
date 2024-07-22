const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
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
app.use(express.json());
app.use(nocache());
app.use(bodyParser.json());

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
            }, jwtSecret, {expiresIn: '30min'});
            res.json({token});
          } else {
            const token = jwt.sign({
              username: user.username,
              route: "/home"
            }, jwtSecret, {expiresIn: '30min'});
            res.json({token});
          }
        } else {
          res.status(401).send('Unauthorized'); // User does not exist or incorrect credentials
        } 
        
      }
  );
});

app.post('/profile', (req, res) => {
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

app.get('/getJWTData', verifyToken, (req, res) => {
  res.json({user: req.user});
});

app.get('/admin', async(req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/admin/backupRequestTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT r.requestID, r.message, r.requestDate, s.location, r.status FROM edbs.requests r JOIN edbs.servers s ON r.serverID = s.serverID";
  
  if (col !== "any" && order !== "any") {
    query += ` ORDER BY ${col} ${order}`;
  }
  
  conn.query(query, (err, results, fields) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    results.forEach(result => {
      result.requestDate.setDate(result.requestDate.getDate() + 1);
    });

    res.json(results); // Send JSON response with backup requests data
  });

}); 

app.post('/admin/logsTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT b.backupID, b.backupDate, s.location, bu.username FROM edbs.backups b JOIN edbs.servers s ON b.serverID = s.serverID JOIN edbs.backupusers bu ON b.backupID = bu.backupID";

  if (col !== "any" && order !== "any") {
    query += ` ORDER BY ${col} ${order}`;
  }
  
  conn.query(query, (err, results, fields) => {
    if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }

    results.forEach(result => {
      result.backupDate.setHours(result.backupDate.getHours() + 3);
    })

    res.json(results);
  });
}); 

app.post('/admin/getlog'), (req, res) => {
  conn.query("SELECT log FROM edbs.servers WHERE backupID = ?"),
  [backupID],
  (err, results, fields) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    console.log(results[0]);
    res.json(results[0]);
  }
};

app.post('/admin/deleteRequest', (req, res) =>{
  const requestID = req.body.requestID;

  conn.query('DELETE FROM edbs.requests WHERE requestID = ?', [requestID], (error, results, fields) => {
    if (error) {
      console.error('Error deleting row from database:', error);
      res.status(500).json({ error: 'Error deleting row from database' });
      return;
    }
    console.log(requestID);
    res.status(200).json({ message: 'Row deleted successfully' }); // Send success response
  });
});

app.post('/admin/periodicRequests', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;

  let query = "SELECT r.requestID, r.message, s.location, r.period, r.requestDate AS nextDate FROM edbs.requests r JOIN edbs.servers s ON r.serverID = s.serverID WHERE r.period != 'None'"
    
  if (col !== "any" && order !== "any") {
    query += ` ORDER BY ${col} ${order}`;
  }
  
  conn.query(query, (err, results, fields) => {
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

app.post('/admin/makerequest', (req, res) => {
  const serverID = req.body.serverID;
  const period = req.body.period;
  const message = req.body.message;
  const requestDate = req.body.requestDate;

  conn.query("INSERT INTO edbs.requests (message, requestDate, status, period, serverID) VALUES (?, ?, 'Not Completed', ?, ?)",
    [message, requestDate, period, serverID],
    function(err, results, fields) {
      if (err) {
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
        return;
      }
      res.json("ok");
    }
  )

});

app.post('/takeBackup', (req, res) => { 
  let query = "START TRANSACTION; "+
              "INSERT INTO edbs.backups (log, backupDate, serverID) VALUES ('AAAAA', NOW(), (SELECT serverID FROM edbs.users WHERE username = ?)); "+
              "SET @backupID = (SELECT MAX(backupID) FROM edbs.backups); "+
              "INSERT INTO edbs.backupusers (backupID, username) "+
              "VALUES (@backupID, ?); "+
              "COMMIT;"

    conn.query(query, [currentUser, currentUser], (err, results, fields) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json("ok");
    });
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

app.post('/home/backupRequestTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT r.requestID, r.message, r.requestDate, r.status FROM edbs.requests r JOIN edbs.users u ON r.serverID = u.serverID WHERE u.username = ?";
  
  if (col !== "any" && order !== "any") {
    query += ` ORDER BY ${col} ${order}`;
  }
  
  conn.query(query, [currentUser], (err, results, fields) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    results.forEach(result => {
      result.requestDate.setDate(result.requestDate.getDate() + 1);
    });

    res.json(results); // Send JSON response with backup requests data
  });

}); 

app.post('/home/logsTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT b.backupID, b.backupDate, s.location FROM edbs.backups b JOIN edbs.servers s ON b.serverID = s.serverID JOIN edbs.backupusers bu ON b.backupID = bu.backupID JOIN edbs.users u ON bu.username = u.username WHERE u.username = ?";

  if (col !== "any" && order !== "any") {
    query += ` ORDER BY ${col} ${order}`;
  }
  
  conn.query(query, [currentUser], (err, results, fields) => {
    if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }

    results.forEach(result => {
      result.backupDate.setHours(result.backupDate.getHours() + 3);
    })

    res.json(results);
  });
}); 

app.listen(process.env.PORT, () => {
  console.log("Server successfully running");
});
