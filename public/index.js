document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is fully loaded");

    const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
    console.log("Token:", token);  // Check if token is available

    if (token) {
        axios.get('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
        .then(response => {
            console.log("Response:", response); // Log the response to verify the data
            const userName = response.data.fullName; // Get the user's full name from the response
            document.getElementById('user-name').textContent = userName; // Replace the placeholder with the actual name
        })
        .catch(error => {
            console.error("Error fetching user profile:", error);
        });
    } else {
        console.log("No token found. Please log in.");
    }
});
