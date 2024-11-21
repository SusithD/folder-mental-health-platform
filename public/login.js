document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    let isValid = true;

    // Clear previous error messages
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required.';
        isValid = false;
    } else if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Enter a valid email address.';
        isValid = false;
    }

    // Validate Password
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required.';
        isValid = false;
    }

    // If validation fails, return early
    if (!isValid) {
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login successful');
            localStorage.setItem('authToken', data.token);
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'An error occurred.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again later.');
    }
});
