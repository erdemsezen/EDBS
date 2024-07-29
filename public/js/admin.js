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
  populateBackupRequestsTable('any', 'any');
  populateFilesTable('any', 'any');
  populatePeriodicTable('any', 'any');  
  document.getElementById('backuprequests').style.display = 'none';
  document.getElementById('makerequest').style.display = 'none';
  document.getElementById('backupfiles').style.display = 'none';
  document.getElementById('uploadbackup').style.display = 'none';
  
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

function downloadFile(backupID) {
  window.location.href = `/download/${backupID}`;
}

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
    let buttonType = "";
  
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
        case 'Waiting Confirmation':
          buttonType = "<button onclick='confirm(this)>Confirm</button> <button onclick='dontConfirm(this)>Don't Confirm</button>"
          break;
        case 'Not Confirmed':
          break;
        default:
          backgroundColor = 'white'; // Default or other statuses
          break;
      }

      row.style.backgroundColor = backgroundColor;
      row.style.color = yaziRenk;
      row.innerHTML = `
        <td>${request.requestID}</td>
        <td>${request.message}</td>
        <td>${request.requestDate.split("T")[0]}</td>
        <td>${request.location}</td>
        <td>${request.status}</td>
        <td>
          <button onclick="deleteRow(this)">DELETE</button>
          ${buttonType}
          </td>
      `;
      tableBody.appendChild(row);
      buttonType = "";
    });
  }).catch(error => {
    console.error('Error:', error);
  });
}

function populateFilesTable(col, order) {
  fetch('/admin/filesTable', {
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
    const tableBody = document.querySelector('#backupfiles tbody');
    tableBody.innerHTML = ''; // Clear existing rows
  
    data.forEach(request => {
      const row = document.createElement('tr');
      row.id = request.backupID
      row.innerHTML = `
        <td>${request.backupID}</td>
        <td>${request.location}</td>
        <td>${request.username}</td>
        <td>${request.backupDate.split("T")[0]}</td>
        <td>${request.backupDate.split("T")[1].split(".")[0]}</td>
        <td><button onclick="downloadFile(${request.backupID})">DOWNLOAD</button></td>
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
populateFilesTable('any', 'any');
populatePeriodicTable('any', 'any');

// Sortable Tables
document.addEventListener("DOMContentLoaded", function() {
  populateBackupRequestsTable('any', 'any');
  populateFilesTable('any', 'any');
  populatePeriodicTable('any', 'any');  
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

  // Backup Files table sorting logic
  const filesTable = document.querySelector('#backupfiles .sortable-table');
  const filesHeaders = filesTable.querySelectorAll('th[data-sort-by]');
  let currentFilesSortColumn = null;
  let isFilesAscending = true;

  filesHeaders.forEach((header, index) => {
    if (index < filesHeaders.length) { // Exclude last header
      header.addEventListener('click', function() {
        const sortBy = this.getAttribute('data-sort-by');

        if (sortBy === currentFilesSortColumn) {
          isFilesAscending = !isFilesAscending;
        } else {
          filesHeaders.forEach(header => {
            header.classList.remove('arrow-up', 'arrow-down');
          });
          currentFilesSortColumn = sortBy;
          isFilesAscending = true;
        }

        if (isFilesAscending) {
          this.classList.add('arrow-up');
          this.classList.remove('arrow-down');
          ASCorDESC = "ASC";
        } else {
          this.classList.add('arrow-down');
          this.classList.remove('arrow-up');
          ASCorDESC = "DESC";
        }
        populateFilesTable(currentFilesSortColumn, ASCorDESC);
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
    populateBackupRequestsTable('any', 'any');
    populateFilesTable('any', 'any');
    populatePeriodicTable('any', 'any');  
  }).catch(error => {
    console.error('Error:', error);
    statusMessage.innerHTML = 'Could not create request.';
    document.getElementById("backupMessage").value = "";
  });
  
});

