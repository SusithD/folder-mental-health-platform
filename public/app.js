document.getElementById('signupForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const captchaResponse = grecaptcha.getResponse();
    // Check if CAPTCHA is solved
    if (!captchaResponse) {
        document.getElementById('captchaError').textContent = 'Please complete the CAPTCHA.';
        return;
    }

    // Collecting and sanitizing form data
    const fullName = sanitizeInput(document.getElementById('fullName').value.trim());
    const email = sanitizeInput(document.getElementById('email').value.trim());
    const password = sanitizeInput(document.getElementById('password').value.trim());
    const confirmPassword = sanitizeInput(document.getElementById('confirmPassword').value.trim());
    const dob = sanitizeInput(document.getElementById('dob').value.trim());
    const gender = sanitizeInput(document.getElementById('gender').value.trim());
    const phone = sanitizeInput(document.getElementById('phone').value.trim());
    const emergencyContact = sanitizeInput(document.getElementById('emergencyContact').value.trim());
    const role = sanitizeInput(document.getElementById('role').value.trim());
    const language = sanitizeInput(document.getElementById('language').value.trim());
    const securityQuestion = sanitizeInput(document.getElementById('securityQuestion').value.trim());
    const securityAnswer = sanitizeInput(document.getElementById('securityAnswer').value.trim());

    let isValid = true;

    // Clear previous error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => (msg.textContent = ''));

    // Validate Full Name
    if (!fullName) {
        document.getElementById('nameError').textContent = 'Full name is required.';
        isValid = false;
    }

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
    } else if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters long.';
        isValid = false;
    }

    // Validate Confirm Password
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match.';
        isValid = false;
    }

    // Validate Date of Birth
    if (!dob) {
        document.getElementById('dobError').textContent = 'Date of Birth is required.';
        isValid = false;
    }

    // Validate Emergency Contact
    const phoneRegex = /^[0-9]{10}$/;
    if (!emergencyContact) {
        document.getElementById('emergencyContactError').textContent = 'Emergency contact number is required.';
        isValid = false;
    } else if (!phoneRegex.test(emergencyContact)) {
        document.getElementById('emergencyContactError').textContent = 'Enter a valid emergency contact number (10 digits).';
        isValid = false;
    }

    // Validate Security Answer
    if (!securityAnswer) {
        document.getElementById('securityAnswerError').textContent = 'Answer to security question is required.';
        isValid = false;
    }

    if (!isValid) {
        return; // Prevent form submission if validation fails
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
        securityAnswer,
        captchaToken: captchaResponse
    };

    // Send the data to the server
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Signup successful, please log in.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'An error occurred.');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        alert(`An error occurred. Please try again later.\nError details: ${error.message}`);
    }
});

/**
 * Sanitizes input to remove potentially harmful characters.
 * @param {string} input - The user input to sanitize.
 * @returns {string} The sanitized input.
 */
function sanitizeInput(input) {
    return input
        .replace(/&/g, '&amp;')   // Replace & with &amp;
        .replace(/</g, '&lt;')   // Replace < with &lt;
        .replace(/>/g, '&gt;')   // Replace > with &gt;
        .replace(/"/g, '&quot;') // Replace " with &quot;
        .replace(/'/g, '&#39;'); // Replace ' with &#39;
}

// Dynamic validation with sanitization
const fields = [
    { id: 'fullName', errorId: 'nameError' },
    { id: 'email', errorId: 'emailError' },
    { id: 'password', errorId: 'passwordError' },
    { id: 'confirmPassword', errorId: 'confirmPasswordError' },
    { id: 'dob', errorId: 'dobError' },
    { id: 'emergencyContact', errorId: 'emergencyContactError' },
    { id: 'securityAnswer', errorId: 'securityAnswerError' }
];

fields.forEach(field => {
    const input = document.getElementById(field.id);

    input.addEventListener('input', function () {
        const sanitizedValue = sanitizeInput(input.value);
        input.value = sanitizedValue;

        const errorMessageElement = document.getElementById(field.errorId);

        errorMessageElement.textContent = '';

        if (field.id === 'fullName' && !sanitizedValue) {
            errorMessageElement.textContent = 'Full name is required.';
        } else if (field.id === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!sanitizedValue) {
                errorMessageElement.textContent = 'Email is required.';
            } else if (!emailRegex.test(sanitizedValue)) {
                errorMessageElement.textContent = 'Enter a valid email address.';
            }
        } else if (field.id === 'password') {
            if (!sanitizedValue) {
                errorMessageElement.textContent = 'Password is required.';
            } else if (sanitizedValue.length < 6) {
                errorMessageElement.textContent = 'Password must be at least 6 characters long.';
            }
        } else if (field.id === 'confirmPassword') {
            if (sanitizedValue !== document.getElementById('password').value.trim()) {
                errorMessageElement.textContent = 'Passwords do not match.';
            }
        } else if (field.id === 'dob' && !sanitizedValue) {
            errorMessageElement.textContent = 'Date of Birth is required.';
        } else if (field.id === 'emergencyContact') {
            const phoneRegex = /^[0-9]{10}$/;
            if (!sanitizedValue) {
                errorMessageElement.textContent = 'Emergency contact number is required.';
            } else if (!phoneRegex.test(sanitizedValue)) {
                errorMessageElement.textContent = 'Enter a valid emergency contact number (10 digits).';
            }
        } else if (field.id === 'securityAnswer' && !sanitizedValue) {
            errorMessageElement.textContent = 'Answer to security question is required.';
        }
    });
});
