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
    document.getElementById('edit/createusers').style.display = 'none';
    
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
    window.location.href = '../login/index.html';
}

// Backup Requests menu
document.addEventListener("DOMContentLoaded", function() {
    const table = document.querySelector('.sortable-table');
    const headers = table.querySelectorAll('th[data-sort-by]');
    let currentSortColumn = null;  // Track currently sorted column
    let isAscending = true;        // Track sorting order
  
    headers.forEach(header => {
      header.addEventListener('click', function() {
        const sortBy = this.getAttribute('data-sort-by');
  
        // Toggle arrow direction
        if (sortBy === currentSortColumn) {
          isAscending = !isAscending;  // Toggle sorting order
        } else {
          // Reset arrows and sorting state for previous column
          headers.forEach(header => {
            header.classList.remove('arrow-up', 'arrow-down');
          });
          currentSortColumn = sortBy;
          isAscending = true;  // Default to ascending order for new column
        }
  
        // Set arrow direction
        if (isAscending) {
          this.classList.add('arrow-up');
          this.classList.remove('arrow-down');
        } else {
          this.classList.add('arrow-down');
          this.classList.remove('arrow-up');
        }
  
        // Perform sorting (this is where you would sort your table rows)
  
        // For demonstration, log the sorting details
        console.log(`Sorted by ${sortBy} in ${isAscending ? 'ascending' : 'descending'} order.`);
      });
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