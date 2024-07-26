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

function downloadFile(backupID) {
  window.location.href = `/download/${backupID}`;
}

function showDashboard(dashboardName) {

  document.getElementById('backuprequests').style.display = 'none';
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

function sendBackup(id) {
  const popup = document.getElementById('backupPopup');
  const overlay = document.getElementById('overlay1');
  const requestID = document.getElementById('requestID');
  requestID.value = id;

  popup.style.display = 'block';
  overlay.style.display = 'block';

  const closePopup = document.getElementById('closeBackupPopup');
  closePopup.onclick = function() { 
    popup.style.display = 'none'; 
    overlay.style.display = 'none'; 
  };

  overlay.addEventListener('click', (event) => {
    // Check if the click is outside the popup-content
    if (!popup.contains(event.target) && event.target !== closePopupButton) {
      requestID.value = "null";
      closePopup();
    }
  });

}

function uploadBackup(button) {
  const popup = document.getElementById('uploadPopup');
  const overlay = document.getElementById('overlay');
  popup.style.display = 'block';
  overlay.style.display = 'block';

  const closePopup = document.getElementById('closeUploadPopup');
  closePopup.onclick = function() { 
    popup.style.display = 'none'; 
    overlay.style.display = 'none'; 
  };

  overlay.addEventListener('click', (event) => {
    // Check if the click is outside the popup-content
    if (!popup.contains(event.target) && event.target !== closePopupButton) {
        closePopup();
    }
  });

}

function logout() {
    localStorage.removeItem('token');
    window.location.href = "/";
}

function setupFormSubmitHandlers() {
  // Handle Backup Form Submission
  const uploadForm = document.getElementById('uploadForm');
  if (uploadForm) {
      uploadForm.addEventListener('submit', function(event) {
          event.preventDefault(); // Prevent default form submission
          // Perform the form submission using fetch or another method
          const formData = new FormData(uploadForm);

          fetch(uploadForm.action, {
              method: uploadForm.method,
              body: formData
          }).then(response => {
              if (response.ok) {
                const popup = document.getElementById("backupPopup");
                const overlay = document.getElementById("overlay1");
                popup.style.display = 'none';
                overlay.style.display = 'none';
              } else {
                  console.error('Upload failed:', response.statusText);
              }
              // populateBackupRequestsTable('any', 'any');
              window.location.reload();
          }).catch(error => {
              console.error('Error:', error);
          });
          window.location.reload();
      });
  }
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

      let buttonType = "---"
      let backgroundColor = '';
      let yaziRenk = '';
      switch (request.status) {
        case 'Not Completed':
          backgroundColor = 'orangered';
          yaziRenk = 'White';
          break;
        case 'Pending':
          backgroundColor = 'lightyellow'; // Adjust color as needed
          buttonType = `<button onclick='sendBackup(${request.requestID})'>SEND BACKUP</button>`;
          break;
        case 'Error':
          backgroundColor = 'orange'; // Adjust color as needed
          yaziRenk = 'White';
          buttonType = `<button onclick='sendBackup(${request.requestID})'>SEND BACKUP AGAIN</button>`;
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
        <td>${request.username}</td>
        <td>${request.status}</td>
        <td class="button">${buttonType}</td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error('Error:', error);
  });
}

function populateFilesTable(col, order) {
  fetch('/home/filesTable', {
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
        <td>${request.location}</td>
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

populateProfilePanel();
populateBackupRequestsTable('any', 'any');
populateFilesTable('any', 'any');
setupFormSubmitHandlers();

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
              ASCorDESC = "ASC";
          } else {
              this.classList.add('arrow-down');
              this.classList.remove('arrow-up');
              ASCorDESC = "DESC";
          }
          populateBackupRequestsTable(currentBackupSortColumn, ASCorDESC);
      });
  });

  // Files table sorting logic
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
});