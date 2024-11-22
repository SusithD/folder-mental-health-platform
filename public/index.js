document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is fully loaded");

    const token = localStorage.getItem('authToken');
    console.log("Token:", token);

    if (token) {
        // Fetch user profile
        axios.get('http://localhost:3000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            console.log(response.data);
            document.getElementById('user-name').textContent = response.data.fullName;
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            alert('Failed to load user profile.');
        });

        // Fetch latest assessment
        const resultElement = document.getElementById('assessment-result');
        axios.get('http://localhost:3000/api/user/assessment-result', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            const { stress_level, energy_level, happiness_level, score, created_at } = response.data;

            // Format the retrieved details
            const formattedDate = new Date(created_at).toLocaleString();
            resultElement.innerHTML = `
                <p><strong>Stress Level:</strong> ${stress_level}</p>
                <p><strong>Energy Level:</strong> ${energy_level}</p>
                <p><strong>Happiness Level:</strong> ${happiness_level}</p>
                <p><strong>Overall Score:</strong> ${score}</p>
                <p><strong>Submitted on:</strong> ${formattedDate}</p>
            `;
        })
        .catch(error => {
            console.error('Error fetching assessment:', error);
            resultElement.innerHTML = '<p>No previous assessments found.</p>';
        });
    } else {
        console.log("No token found in localStorage.");
        document.getElementById('assessment-result').innerHTML = '<p>Please log in to view your assessment history.</p>';
    }

    // Handling form submission
    const assessmentForm = document.getElementById('assessment-form');
    assessmentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const stressLevel = document.getElementById('stress-level').value;
        const energyLevel = document.getElementById('energy-level').value;
        const happinessLevel = document.getElementById('happiness-level').value;

        const payload = {
            stress_level: stressLevel,
            energy_level: energyLevel,
            happiness_level: happinessLevel
        };

        axios.post('http://localhost:3000/api/user/assessments', payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            document.getElementById('assessment-result').textContent = 'Assessment submitted successfully!';
        })
        .catch(error => {
            console.error('Error submitting assessment:', error);
            document.getElementById('assessment-result').textContent = 'Error submitting assessment.';
        });
    });
});
