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
                // console.log("Response data:", response.data);
                if (response.data && response.data.fullName) {
                    const user = response.data;

                    document.getElementById('fullName').textContent = user.fullName || 'Name not provided';
                    document.getElementById('email').textContent = user.email || 'Email not provided';
                    document.getElementById('dob').textContent = user.dob
                        ? new Date(user.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'DOB not provided';
                    document.getElementById('gender').textContent = user.gender || 'Not Provided';
                    document.getElementById('phone').textContent = user.phone || 'Not Provided';
                    document.getElementById('emergencyContact').textContent = user.emergencyContact || 'Not Provided';
                    document.getElementById('language').textContent = user.language || 'Not Provided';

                    // Update profile image
                    if (user.profileImage) {
                        document.getElementById('profileImage').src = user.profileImage;
                    }
                } else {
                    console.error('API returned failure:', response.data);
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
