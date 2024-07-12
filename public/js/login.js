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
    })
    .then(response => {
        if (!response.ok) {
            document.getElementById('alert').style.display = "block";
            document.getElementById('password').value = '';
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(json => {
            window.location.href = json.home;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});