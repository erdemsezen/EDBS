document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting

    // Perform your authentication logic here (e.g., check username and password)
    var username = document.getElementById('userID').value;
    var password = document.getElementById('password').value;

    // Example authentication logic (replace with your actual authentication)
    if (username === 'admin' && password === 'password') {
        window.location.href = 'admin/main-page/index.html';
    } else {
        document.getElementById('alert').style.display = "block";
        document.getElementById('password').value = '';
    }
});