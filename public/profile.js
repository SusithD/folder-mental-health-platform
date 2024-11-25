document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is fully loaded");

    const token = localStorage.getItem('authToken');
    console.log("Token:", token);

    if (token) {
        // Fetch user profile
        axios.get('http://localhost:3000/api/user/user-details', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            console.log(response.data);
            if (response.data.success) {
                const user = response.data.user;
                document.getElementById('fullName').textContent = user.fullName;
                document.getElementById('email').textContent = user.email;

                // Format DOB to a readable format
                const dob = new Date(user.dob);
                const formattedDob = dob.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                document.getElementById('dob').textContent = formattedDob;

                document.getElementById('gender').textContent = user.gender;
                document.getElementById('phone').textContent = user.phone || 'Not Provided';
                document.getElementById('emergencyContact').textContent = user.emergencyContact || 'Not Provided';
                document.getElementById('language').textContent = user.language || 'Not Provided';
                document.getElementById('role').textContent = user.role || 'Not Provided'; // If 'role' is available
                document.getElementById('securityQuestion').textContent = user.securityQuestion || 'Not Provided'; // If 'securityQuestion' is available
                document.getElementById('securityAnswer').textContent = user.securityAnswer || 'Not Provided'; // If 'securityAnswer' is available
            } else {
                alert('Failed to retrieve user data.');
            }
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            alert('Failed to load user profile.');
        });
    } else {
        console.warn('No authentication token found.');
        alert('You are not logged in. Please log in to view your profile.');
    }
});
