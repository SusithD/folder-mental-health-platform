document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is fully loaded");

    const token = localStorage.getItem('authToken');
    console.log("Token:", token);

    if (token) {
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

        const resultElement = document.getElementById('assessment-result');
        axios.get('http://localhost:3000/api/user/assessment-result', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            const { stress_level, energy_level, happiness_level, score, created_at } = response.data;

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

        // Fetch and display the latest activity data
        axios.get('http://localhost:3000/api/user/activity-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            const { steps_per_day, calories_burned, active_days, most_active_day, inactive_days, weekly_goal } = response.data;
            document.getElementById('steps-per-day').textContent = `${steps_per_day}/day`;
            document.getElementById('calories-burned').textContent = `${calories_burned} kcal`;
            document.getElementById('active-days').textContent = `${active_days}/7`;
            document.getElementById('most-active-day').textContent = most_active_day;
            document.getElementById('inactive-days').textContent = inactive_days;
            document.getElementById('weekly-goal').textContent = weekly_goal;
        })
        .catch(error => {
            console.error('Error fetching activity data:', error);
            document.getElementById('activity-status').textContent = 'Unable to fetch activity data.';
        });
    } else {
        console.log("No token found in localStorage.");
        document.getElementById('assessment-result').innerHTML = '<p>Please log in to view your assessment history.</p>';
        document.getElementById('sleep-result').innerHTML = '<p>Please log in to view your sleep data.</p>';
        document.getElementById('activity-status').textContent = 'Please log in to view your activity data.';
    }

    // Handling form submissions
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

    const activityForm = document.getElementById('activity-form');
    activityForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const stepsToday = document.getElementById('steps-today').value;

        const payload = {
            steps_per_day: stepsToday,
            calories_burned: Math.floor(stepsToday * 0.04),
            active_days: Math.min(7, Math.ceil(stepsToday / 10000)),
            most_active_day: 'Today',
            inactive_days: 'None',
            weekly_goal: 'Reach 70,000 steps (10,000/day)'
        };

        axios.post('http://localhost:3000/api/user/activity', payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            document.getElementById('activity-status').textContent = 'Activity data submitted successfully!';
        })
        .catch(error => {
            console.error('Error submitting activity data:', error);
            document.getElementById('activity-status').textContent = 'Error submitting activity data.';
        });
    });
});
