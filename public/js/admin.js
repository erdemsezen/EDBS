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

// Insert user info
fetch('/admin/profile', {
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
  console.error('Error:', error);
});

// Populate Backup Requests Table
fetch('/admin/backupTable', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token
  },
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
  const tableBody = document.querySelector('#backuprequests tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  data.forEach(request => {
    const row = document.createElement('tr');
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

// Sortable Tables
document.addEventListener("DOMContentLoaded", function() {
  // Backup Requests table sorting logic
  const backupTable = document.querySelector('#backuprequests .sortable-table');
  const backupHeaders = backupTable.querySelectorAll('th[data-sort-by]');
  let currentBackupSortColumn = null;
  let isBackupAscending = true;

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
          } else {
              this.classList.add('arrow-down');
              this.classList.remove('arrow-up');
          }

          console.log(`Sorted backup requests by ${sortBy} in ${isBackupAscending ? 'ascending' : 'descending'} order.`);
          // Perform actual sorting here
      });
  });

  // See Logs table sorting logic
  const logsTable = document.querySelector('#seelogs .sortable-table');
  const logsHeaders = logsTable.querySelectorAll('th[data-sort-by]');
  let currentLogsSortColumn = null;
  let isLogsAscending = true;

  logsHeaders.forEach((header, index) => {
    if (index < logsHeaders.length - 1) { // Exclude last header
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
        } else {
          this.classList.add('arrow-down');
          this.classList.remove('arrow-up');
        }

        console.log(`Sorted logs by ${sortBy} in ${isLogsAscending ? 'ascending' : 'descending'} order.`);
        // Perform actual sorting here
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
        } else {
          this.classList.add('arrow-down');
          this.classList.remove('arrow-up');
        }

        console.log(`Sorted make request by ${sortBy} in ${isRequestAscending ? 'ascending' : 'descending'} order.`);
        // Perform actual sorting here
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

document.getElementById('requestForm').addEventListener('submit', function(submitEvent) {
  submitEvent.preventDefault();

  let backupDate;

  if (requestNowRadio.checked) {
    backupDate = formatDate(date());
  } else {
    backupDate = formatDate(document.getElementById('backupDate').value);
  }

  const period = document.getElementById('repeat')

});


// Populate periodic requests table
fetch('/admin/periodicRequests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token
  },
}).then(response => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = "/";
      }
    throw new Error('Network response was not ok');
  }
  return response.json();
}).then(json => {
  const tableBody = document.querySelector('#makerequest tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  json.forEach(request => {
    const row = document.createElement('tr');
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

