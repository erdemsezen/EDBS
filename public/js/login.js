localStorage.removeItem('token');

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting

    const username = document.getElementById('userID').value;
    const password = document.getElementById('password').value;

    fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    }).then(response => {
        if (!response.ok) {
            document.getElementById('alert').style.display = "block";
            document.getElementById('password').value = '';
            throw new Error('Network response was not ok');
        }
        return response.json(); // Return the promise for parsing JSON
    }).then(data => {
        localStorage.setItem('token', data.token); // Set token in localStorage
        forwardPage(); // Proceed to forwardPage after successful token retrieval
    }).catch(error => {
    console.error('Error:', error);
    });
});

function forwardPage() {
    const token = localStorage.getItem('token');

    fetch('/getJWTData', {
        headers: {
            'Authorization': token
        }
    }).then(response => {return response.json();})
    .then(data => {
        window.location.href = data.user.route;
    }).catch(error => {
        alert(error);
      });
}