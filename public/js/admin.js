function formatDate(date) { // Function for turning date intodesired format
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}

backupDate.min = new Date().toISOString().split("T")[0];
let token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/';
}

function showDashboard(dashboardName) {
    // Hide all dashboards
    // var dashboards = document.getElementsByClassName('dashboard');
    // for (var i = 0; i < dashboards.length; i++) {
    //     dashboards[i].style.display = 'none';
    // }

  document.getElementById('backuprequests').style.display = 'none';
  document.getElementById('makerequest').style.display = 'none';
  document.getElementById('seelogs').style.display = 'none';
  document.getElementById('takebackup').style.display = 'none';
  
  // Display the selected dashboard
  var selectedDashboard = document.getElementById(dashboardName.toLowerCase().replace(' ', ''));
  if (selectedDashboard) {
      selectedDashboard.style.display = 'block';
  }

  // Update the dashboard title
  document.getElementById('dashboardTitle').textContent = dashboardName;
}

function takeBackup(button) {

  var statusMessage = document.getElementById('statusMessage');
  fetch('/takeBackup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    statusMessage.innerHTML = 'Backup successfully taken.';
  }).catch(error => {
    console.error('Error:', error);
    statusMessage.innerHTML = 'Could not take backup.';
  });
}

// Log out menu
function logout() {
  localStorage.removeItem('token');
  window.location.href = "/";
}

function getJWTData() {
  fetch('/getJWTData', {
    headers : {
      'Authorization' : token
    }
  })
  .then(response => {
    return response.json();
  })
  .then(data => {
    return data.user.username;
  })
  .catch(error => {
    alert(error);
  });
}

function deleteRow(button) {
  var row = button.closest('tr');
  var requestID = row.id;

  fetch('/admin/deleteRequest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestID: requestID })
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    row.parentNode.removeChild(row);
  }).catch(error => {
    console.error('Error:', error);
  });
}

// Pop-up algorithm
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');
const closePopupBtn = document.getElementById('closePopup');
const logstablecontainer = document.getElementById("logstable");

function viewLog(button) {
  var row = button.closest('tr');
  if(row) {
    var backupID = row.id;
  }

  fetch('/admin/getlog', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ backupID })
}).then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}).then(data => {
  popup.style.display = 'block';
  logstablecontainer.style.display = 'none';
  popupContent.textContentL = data.log;
}).catch(error => {
  console.error('Error:', error);
});
}
closePopupBtn.addEventListener('click', function() {
  popup.style.display = 'none';
  logstablecontainer.style.display = 'block';
});
window.addEventListener('click', function(event) {
  if (event.target === popup) {
    popup.style.display = 'none';
    logstablecontainer.style.display = 'block';
  }
});

function populateBackupRequestsTable(col, order) {
  fetch('/admin/backupRequestTable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ col:col, order:order })
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    const tableBody = document.querySelector('#backuprequests tbody');
    tableBody.innerHTML = ''; // Clear existing rows
  
    data.forEach(request => {
      const row = document.createElement('tr');
      row.id = request.requestID

      let backgroundColor = '';
      let yaziRenk = '';
      switch (request.status) {
        case 'Not Completed':
          backgroundColor = 'orangered';
          yaziRenk = 'White';
          break;
        case 'Pending':
          backgroundColor = 'lightyellow'; // Adjust color as needed
          break;
        case 'Error':
          backgroundColor = 'orange'; // Adjust color as needed
          yaziRenk = 'White';
          break;
        case 'Completed':
          backgroundColor = 'MediumSeaGreen';
          yaziRenk = 'White';
          break;
        default:
          backgroundColor = 'white'; // Default or other statuses
          break;
      }

      row.style.backgroundColor = backgroundColor;
      row.style.color = yaziRenk;
      row.innerHTML = `
        <td>${request.message}</td>
        <td>${request.requestDate.split("T")[0]}</td>
        <td>${request.location}</td>
        <td>${request.status}</td>
        <td><button onclick="deleteRow(this)">DELETE</button></td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error('Error:', error);
  });
}

function populateLogsTable(col, order) {
  fetch('/admin/logsTable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ col:col, order:order })
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    const tableBody = document.querySelector('#seelogs tbody');
    tableBody.innerHTML = ''; // Clear existing rows
  
    data.forEach(request => {
      const row = document.createElement('tr');
      row.id = request.backupID
      row.innerHTML = `
        <td>${request.location}</td>
        <td>${request.username}</td>
        <td>${request.backupDate.split("T")[0]}</td>
        <td>${request.backupDate.split("T")[1].split(".")[0]}</td>
        <td><button onclick="viewLog(this)">VIEW</button></td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error('Error:', error);
  });
}

function populatePeriodicTable(col, order) {
  fetch('/admin/periodicRequests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({ col:col, order:order })
  }).then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = "/";
        }
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    const tableBody = document.querySelector('#makerequest tbody');
    tableBody.innerHTML = ''; // Clear existing rows
  
    data.forEach(request => {
      const row = document.createElement('tr');
      row.id = request.requestID
      row.innerHTML = `
        <td>${request.message}</td>
        <td>${request.location}</td>
        <td>${request.period}</td>
        <td>${request.nextDate.split("T")[0]}</td>
        <td><button onclick="deleteRow(this)">DELETE</button></td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error('Error:', error);
  });
  
}

function populateProfilePanel() {
  fetch('/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    const userinfo = data[0];
    const profilePicSrc = userinfo.imgPath ? userinfo.imgPath : 'img/pfp.png';
  
    document.getElementById("profilepic").src = profilePicSrc;
    document.getElementById("username").innerHTML = userinfo.firstName + " " + userinfo.lastName;
    document.getElementById("position").innerHTML = "-" + userinfo.position + "-";
    document.getElementById("userLocation").innerHTML = "E-DBS<br>" + userinfo.location;
  
  }).catch(error => {
    document.getElementById("profilepic").src = 'img/pfp.png';
    console.error('Error:', error);
  });
}

// Populate pages
populateProfilePanel();
populateBackupRequestsTable('any', 'any');
populateLogsTable('any', 'any');
populatePeriodicTable('any', 'any');

// Sortable Tables
document.addEventListener("DOMContentLoaded", function() {
  // Backup Requests table sorting logic
  const backupTable = document.querySelector('#backuprequests .sortable-table');
  const backupHeaders = backupTable.querySelectorAll('th[data-sort-by]');
  let currentBackupSortColumn = null;
  let isBackupAscending = true;
  let ASCorDESC = "ASC";

  backupHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const sortBy = this.getAttribute('data-sort-by');

      if (sortBy === currentBackupSortColumn) {
        isBackupAscending = !isBackupAscending; 
      } else {
        backupHeaders.forEach(header => {
          header.classList.remove('arrow-up', 'arrow-down');
        });
        currentBackupSortColumn = sortBy;
        isBackupAscending = true;
      }

      if (isBackupAscending) {
        this.classList.add('arrow-up');
        this.classList.remove('arrow-down');
        ASCorDESC = "ASC"
      } else {
        this.classList.add('arrow-down');
        this.classList.remove('arrow-up');
        ASCorDESC = "DESC"
      }
      populateBackupRequestsTable(currentBackupSortColumn, ASCorDESC);
    });
  });

  // See Logs table sorting logic
  const logsTable = document.querySelector('#seelogs .sortable-table');
  const logsHeaders = logsTable.querySelectorAll('th[data-sort-by]');
  let currentLogsSortColumn = null;
  let isLogsAscending = true;

  logsHeaders.forEach((header, index) => {
    if (index < logsHeaders.length) { // Exclude last header
      header.addEventListener('click', function() {
        const sortBy = this.getAttribute('data-sort-by');

        if (sortBy === currentLogsSortColumn) {
          isLogsAscending = !isLogsAscending;
        } else {
          logsHeaders.forEach(header => {
            header.classList.remove('arrow-up', 'arrow-down');
          });
          currentLogsSortColumn = sortBy;
          isLogsAscending = true;
        }

        if (isLogsAscending) {
          this.classList.add('arrow-up');
          this.classList.remove('arrow-down');
          ASCorDESC = "ASC";
        } else {
          this.classList.add('arrow-down');
          this.classList.remove('arrow-up');
          ASCorDESC = "DESC";
        }
        populateLogsTable(currentLogsSortColumn, ASCorDESC);
      });
    }
  });

    // Make Request table sorting logic
    const requestTable = document.querySelector('#makerequest .sortable-table');
    const requestHeaders = requestTable.querySelectorAll('th[data-sort-by]');
    let currentRequestSortColumn = null;
    let isRequestAscending = true;

  requestHeaders.forEach((header, index) => {
    if (index < requestHeaders.length ) { // Exclude last header
      header.addEventListener('click', function() {
        const sortBy = this.getAttribute('data-sort-by');

        if (sortBy === currentRequestSortColumn) {
          isRequestAscending = !isRequestAscending;
        } else {
          requestHeaders.forEach(header => {
            header.classList.remove('arrow-up', 'arrow-down');
          });
          currentRequestSortColumn = sortBy;
          isRequestAscending = true;
        }

        if (isRequestAscending) {
          this.classList.add('arrow-up');
          this.classList.remove('arrow-down');
          ASCorDESC = "ASC";
        } else {
          this.classList.add('arrow-down');
          this.classList.remove('arrow-up');
          ASCorDESC = "DESC";
        }
        populatePeriodicTable(currentRequestSortColumn, ASCorDESC);
      });
  }
  });

});

// Make Request menu 
const requestNowRadio = document.getElementById('requestNow');
const requestLaterRadio = document.getElementById('requestLater');
const dateSelection = document.querySelector('.date-selection');

// Initialize form state based on default radio selection
if (requestNowRadio.checked) {
  dateSelection.classList.add('disabled');
} else {
  dateSelection.classList.remove('disabled');
}
requestNowRadio.addEventListener('change', function() {
  if (this.checked) {
    dateSelection.classList.add('disabled');
  } else {
    dateSelection.classList.remove('disabled');
  }
});

requestLaterRadio.addEventListener('change', function() {
  if (this.checked) {
    dateSelection.classList.remove('disabled');
  } else {
    dateSelection.classList.add('disabled');
  }
});

// Make request Form
document.getElementById('requestForm').addEventListener('submit', function(submitEvent) {
  submitEvent.preventDefault();
  
  const serverID = document.getElementById("location").value;
  const period = document.getElementById('repeat').value;
  const message = document.getElementById("backupMessage").value;
  let requestDate;

  if (requestNowRadio.checked) {
    requestDate = formatDate( new Date().toJSON().split("T")[0]);
  } else {
    requestDate = formatDate(document.getElementById('backupDate').value);
  }

  const statusMessage = document.querySelector('#makerequest p');

  fetch('/admin/makerequest', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ serverID, period, message, requestDate })
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    statusMessage.innerHTML = 'Request successfully created.';
    console.log('Request successfully created.');
    document.getElementById("backupMessage").value = "";
  }).catch(error => {
    console.error('Error:', error);
    statusMessage.innerHTML = 'Could not create request.';
    document.getElementById("backupMessage").value = "";
  });
});

