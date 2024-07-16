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
    window.location.href = "http://localhost:8080/";
}

// Table Filling
// async function populateBackupRequests() {
//   try {
//     const response = await fetch('http://localhost:8080/admin');
//     const data = await response.json();

//     const tableBody = document.querySelector('#backuprequests tbody');
//     tableBody.innerHTML = ''; // Clear existing rows

//     data.forEach(request => {
//       console.log(request[0])
//       // const row = document.createElement('tr');
//       // row.innerHTML = `
//       //   <td>${request.message}</td>
//       //   <td>${request.requestDate}</td>
//       //   <td>${request.location}</td>
//       //   <td>${request.status}</td>
//       //   <td><button onclick="deleteRow(this)">DELETE</button></td>
//       // `;
//       // tableBody.appendChild(row);
//     });
//   } catch (error) {
//     console.error('Error fetching backup requests:', error);
//   }
// }

// // Call the function initially to populate the table on page load
// populateBackupRequests();

fetch('/admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(json => {
  const tableBody = document.querySelector('#backuprequests tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  console.log(json);
  json.forEach(request => {
    console.log(request[0])
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
})
.catch(error => {
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



window.addEventListener('popstate', function(event) {
  history.pushState(null, null, location.href);
});