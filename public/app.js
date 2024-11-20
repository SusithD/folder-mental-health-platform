document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Collecting form data
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const phone = document.getElementById('phone').value;
    const emergencyContact = document.getElementById('emergencyContact').value;
    const role = document.getElementById('role').value;
    const language = document.getElementById('language').value;
    const securityQuestion = document.getElementById('securityQuestion').value;
    const securityAnswer = document.getElementById('securityAnswer').value;

    // Validate passwords
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Create the user object
    const userData = {
        fullName,
        email,
        password,
        dob,
        gender,
        phone,
        emergencyContact,
        role,
        language,
        securityQuestion,
        securityAnswer
    };

    // Send the data to the server
    const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (response.ok) {
        // Successful signup, redirect to login page
        alert('Signup successful, please log in.');
        window.location.href = 'login.html';
    } else {
        // Handle error (show message to user)
        alert(data.message || 'An error occurred.');
    }
});
