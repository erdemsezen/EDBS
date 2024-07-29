const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const conn = require('./db_connection.js');
const jwt = require('jsonwebtoken');
const nocache = require("nocache");
const fileUpload = require('express-fileupload');
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
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024},
  useTempFiles : true,
  tempFileDir : '/uploads/'
}));

app.get('/', async(req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

    conn.query("SELECT * FROM users WHERE username = ? AND pass = ?", 
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
  conn.query("SELECT u.firstName, u.lastName, u.position, u.imagePath, s.location FROM users u JOIN servers s ON u.serverID = s.serverID WHERE u.username = ?",
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

app.post('/upload', async function(req, res, next) {
  if (!req.files || !req.files.file) {
    return res.status(422).send("No files were uploaded");
  }

  let backupID = "";
  let uploadPath;

  conn.query("SELECT MAX(backupID) AS max_backupID FROM backups;", 
  (err, results, fields) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    const requestID = req.body.requestID;
    backupID = (results[0].max_backupID + 1).toString();
    const uploadedFile = req.files.file;
    const ext = uploadedFile.name.split('.').pop();
    uploadPath = "uploads/" + backupID + "." + ext;
    const absoluteUploadPath = path.join(__dirname, '..', uploadPath);
    // Upload the file to DB since db is local path is also local in this case
    uploadedFile.mv(absoluteUploadPath, function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
    })

    conn.query("INSERT INTO backups (fileLocation, backupDate, username) VALUES (?, NOW(), ?)", 
    [uploadPath, currentUser], (err, results, fields) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      if(requestID != "null") {
        conn.query("UPDATE requests SET status = 'Pending' WHERE requestID = ?",
        [requestID], (err, results, fields) => {
          if (err) {
            console.error('Error querying MySQL:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
        });

      }
    });
  })
  res.status(204).end();
});

app.get('/download/:backupId', (req, res) => {
  const backupId = req.params.backupId;

  // Query to get backup file location from database
  const query = `SELECT fileLocation FROM backups WHERE backupID = ?`;
  conn.query(query, [backupId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Error retrieving backup information');
      }
      if (results.length === 0) {
          return res.status(404).send('Backup not found');
      }

      const backupLocation = results[0].fileLocation;

      // Stream the file to the client for download
      const file = path.join(backupLocation);
      res.download(file, (err) => {
          if (err) {
              console.error(err);
              res.status(500).send('Error downloading file');
          } else {
              console.log('File successfully downloaded');
          }
      });
  });
});

app.get('/admin', async(req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/admin/backupRequestTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT r.requestID, r.message, r.requestDate, s.location, r.status FROM requests r JOIN servers s ON r.serverID = s.serverID";
  
  if (col !== "any" && order !== "any") {
    query += ` ORDER BY ${col} ${order}`;
  }
  
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday = yesterday.toISOString().split("T")[0];

  conn.query(query, (err, results, fields) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    results.forEach(result => {
      // result.requestDate.setDate(result.requestDate.getDate() + 1);
      if ((result.requestDate.toISOString().split("T")[0] < yesterday) && (result.status == 'Pending')) {
        conn.query("UPDATE requests r SET r.status = 'Not Completed' WHERE r.requestID = ?",
          [result.requestID], (error, ress, feds) => {
          });
      }
    });

    res.json(results); // Send JSON response with backup requests data
  });

}); 

app.post('/admin/filesTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT b.backupID, b.backupDate, u.username, s.location FROM backups b JOIN users u ON b.username = u.username JOIN servers s ON u.serverID = s.serverID";

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

app.post('/admin/deleteRequest', (req, res) =>{
  const requestID = req.body.requestID;

  conn.query('DELETE FROM requests WHERE requestID = ?', [requestID], (error, results, fields) => {
    if (error) {
      console.error('Error deleting row from database:', error);
      res.status(500).json({ error: 'Error deleting row from database' });
      return;
    }
    res.status(200).json({ message: 'Row deleted successfully' }); // Send success response
  });
});

app.post('/admin/periodicRequests', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;

  let query = "SELECT r.requestID, r.message, s.location, r.period, r.requestDate AS nextDate FROM requests r JOIN servers s ON r.serverID = s.serverID WHERE r.period != 'None'"
    
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
      // result.nextDate.setDate(result.nextDate.getDate() + 1);

      switch (result.period) {
        case 'Day':
          result.nextDate.setDate(result.nextDate.getDate() + 1);
          if (result.nextDate.toISOString().split("T")[0] < today) {
            conn.query(`UPDATE requests r SET r.requestDate = CURDATE() + INTERVAL 1 DAY, r.status = 'Pending' WHERE r.requestID = ?`,
              [result.requestID], (err, ress, feds) => {
                if (err) {
                  console.error('Error querying MySQL:', err);
                  res.status(500).json({ error: 'Internal Server Error' });
                  return;
                }
                result.nextDate.setDate(result.nextDate.getDate() + 1);
              });
          }
          break;
        case 'Week':
          result.nextDate.setDate(result.nextDate.getDate() + 7);
          if (result.nextDate.toISOString().split("T")[0] == today) {
            conn.query(`UPDATE requests r SET r.requestDate = CURDATE() + INTERVAL 7 DAY, r.status = 'Pending' WHERE r.requestID = ?`,
              [result.requestID], (err, ress, feds) => {
                if (err) {
                  console.error('Error querying MySQL:', err);
                  res.status(500).json({ error: 'Internal Server Error' });
                  return;
                }
                result.nextDate.setDate(result.nextDate.getDate() + 7);
              });
          }
          break;
        case 'Month':
          result.nextDate.setMonth(result.nextDate.getMonth() + 1);
          if (result.nextDate.toISOString().split("T")[0] == today) {
            conn.query(`UPDATE requests r SET r.requestDate = CURDATE() + INTERVAL 1 MONTH, r.status = 'Pending' WHERE r.requestID = ?`,
              [result.requestID], (err, ress, feds) => {
                if (err) {
                  console.error('Error querying MySQL:', err);
                  res.status(500).json({ error: 'Internal Server Error' });
                  return;
                }
                result.nextDate.setMonth(result.nextDate.getMonth() + 1);
              });
          }
          break;
        case 'Year':
          result.nextDate.setFullYear(result.nextDate.getFullYear() + 1);
          if (result.nextDate.toISOString().split("T")[0] == today) {
            conn.query(`UPDATE requests r SET r.requestDate = CURDATE() + INTERVAL 1 YEAR, r.status = 'Pending' WHERE r.requestID = ?`,
              [result.requestID], (err, ress, feds) => {
                if (err) {
                  console.error('Error querying MySQL:', err);
                  res.status(500).json({ error: 'Internal Server Error' });
                  return;
                }
                result.nextDate.setFullYear(result.nextDate.getFullYear() + 1);
              });
          }
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
  let period = req.body.period;
  const message = req.body.message;
  const requestDate = req.body.requestDate;

  switch(period) {
    case 'everyday':
      period = 'Day';
      break;
    case 'everyweek':
      period = 'Week';
      break;
    case 'everymonth':
      period = 'Month';
      break;
    case 'everyyear':
      period = 'Year';
      break;
  }

  conn.query("INSERT INTO requests (message, requestDate, status, period, serverID) VALUES (?, ?, 'Pending', ?, ?)",
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

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

app.post('/home/backupRequestTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT r.requestID, r.message, r.requestDate, r.username, r.status FROM requests r JOIN users u ON r.serverID = u.serverID WHERE u.username = ?";
  
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
      // result.requestDate.setDate(result.requestDate.getDate() + 1);
    });

    res.json(results); // Send JSON response with backup requests data
  });

}); 

app.post('/home/filesTable', (req, res) => {
  const col = req.body.col;
  const order = req.body.order;
  
  let query = "SELECT b.backupID, b.backupDate, s.location FROM backups b JOIN users u ON b.username = u.username JOIN servers s ON u.serverID = s.serverID WHERE u.username = ?";

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
