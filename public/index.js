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

    if (token) {
        // Fetch and display the latest sleep data
        axios.get('http://localhost:3000/api/user/sleep-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            const { average_sleep, recommended_sleep, last_night_sleep, sleep_quality, deep_sleep, sleep_consistency, sleep_goal, created_at } = response.data;

            const formattedDate = new Date(created_at).toLocaleString();
            document.getElementById('sleep-result').innerHTML = `
                <p><strong>Average Sleep:</strong> ${average_sleep} hours</p>
                <p><strong>Recommended Sleep:</strong> ${recommended_sleep} hours</p>
                <p><strong>Last Night's Sleep:</strong> ${last_night_sleep} hours</p>
                <p><strong>Sleep Quality:</strong> ${sleep_quality}%</p>
                <p><strong>Deep Sleep:</strong> ${deep_sleep} hours</p>
                <p><strong>Sleep Consistency:</strong> ${sleep_consistency}/7 nights</p>
                <p><strong>Sleep Goal:</strong> ${sleep_goal}</p>
                <p><strong>Data Submitted on:</strong> ${formattedDate}</p>
            `;
        })
        .catch(error => {
            console.error('Error fetching sleep data:', error);
            document.getElementById('sleep-result').innerHTML = '<p>No previous sleep data found.</p>';
        });

        // Handling form submission
        const sleepForm = document.getElementById('sleep-form');
        sleepForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const averageSleep = document.getElementById('average-sleep').value;
            const recommendedSleep = document.getElementById('recommended-sleep').value;
            const lastNightSleep = document.getElementById('last-night-sleep').value;
            const sleepQuality = document.getElementById('sleep-quality').value;
            const deepSleep = document.getElementById('deep-sleep').value;
            const sleepConsistency = document.getElementById('sleep-consistency').value;
            const sleepGoal = document.getElementById('sleep-goal').value;

            const payload = {
                average_sleep: averageSleep,
                recommended_sleep: recommendedSleep,
                last_night_sleep: lastNightSleep,
                sleep_quality: sleepQuality,
                deep_sleep: deepSleep,
                sleep_consistency: sleepConsistency,
                sleep_goal: sleepGoal
            };

            axios.post('http://localhost:3000/api/user/sleep', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                document.getElementById('sleep-result').textContent = 'Sleep data submitted successfully!';
            })
            .catch(error => {
                console.error('Error submitting sleep data:', error);
                document.getElementById('sleep-result').textContent = 'Error submitting sleep data.';
            });
        });
    } else {
        console.log("No token found in localStorage.");
        document.getElementById('sleep-result').innerHTML = '<p>Please log in to view your sleep data.</p>';
    }
});
