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

function sendBackup(button) {
  const popup = document.getElementById('backupPopup');
  popup.style.display = 'block';

  const closePopup = document.getElementById('closeBackupPopup');
  closePopup.onclick = function() { popup.style.display = 'none'; };

  var dropZone = document.getElementById('dropzone');

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add('hover');
  });

  dropZone.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dropZone.classList.remove('hover');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('hover');
    var files = event.dataTransfer.files;
    handlesFiles(files);
  });

  function handlesFiles(files) {
    files.forEach(file => {
      uploadFile(file);
    })
  }

  function uploadFile(file) {
    var formData = new FormData();
    formData.append('file', file);
    fetch('/upload', {
      method: 'POST',
      body: formData
    }).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json()
    }).then(data => {

    })
  }
}

function deleteRow(button) {}

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

function logout() {
    localStorage.removeItem('token');
    window.location.href = "/";
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

function populateBackupRequestsTable(col, order) {
    fetch('/home/backupRequestTable', {
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

        let buttonType = "'sendBackup(this)'>SEND BACKUP";
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
            buttonType = "'deleteRow(this)'>DELETE"
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
          <td>${request.status}</td>
          <td><button onclick=${buttonType}</button></td>
        `;
        tableBody.appendChild(row);
      });
    }).catch(error => {
      console.error('Error:', error);
    });
}

function populateLogsTable(col, order) {
  fetch('/home/logsTable', {
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

populateProfilePanel();
populateBackupRequestsTable('any', 'any');
populateLogsTable('any', 'any');

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

});