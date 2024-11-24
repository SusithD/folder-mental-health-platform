document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is fully loaded");

    const token = localStorage.getItem('authToken');
    console.log("Token:", token);

    if (token) {
        // Fetch upcoming sessions
        axios.get('http://localhost:3000/api/user/sessions', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                const sessions = response.data;
                const sessionListElement = document.getElementById('session-list');
                sessionListElement.innerHTML = '';

                // Loop through sessions and create session cards
                sessions.forEach(session => {
                    const { therapist_name, session_date, session_time, session_type, description, session_id } = session;

                    const sessionCard = document.createElement('div');
                    sessionCard.classList.add('session-card');
                    sessionCard.innerHTML = `
                        <h3>Therapy with ${therapist_name}</h3>
                        <p><strong>Date:</strong> ${new Date(session_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${session_time}</p>
                        <p><strong>Type:</strong> ${session_type}</p>
                        <p><strong>Therapist Experience:</strong> ${description}</p>
                        <button class="btn view-details" data-session-id="${session_id}">View More</button>
                    `;
                    sessionListElement.appendChild(sessionCard);
                });

                // Attach event listener to the session list container (event delegation)
                document.getElementById('session-list').addEventListener('click', (event) => {
                    if (event.target.classList.contains('view-details')) {
                        const sessionId = event.target.getAttribute('data-session-id');
                        viewSessionDetails(sessionId);
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching sessions:', error);
                document.getElementById('session-list').innerHTML = '<p>No upcoming sessions available.</p>';
            });

        // Function to display session details
        function viewSessionDetails(sessionId) {
            axios.get(`http://localhost:3000/api/user/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(response => {
                    const session = response.data;
                    const { therapist_name, session_date, session_time, session_type, fees, description } = session;

                    const popup = document.getElementById('session-details-popup');
                    popup.querySelector('.popup-content').innerHTML = `
                        <h3>Session Details</h3>
                        <p><strong>Therapist:</strong> ${therapist_name}</p>
                        <p><strong>Date:</strong> ${new Date(session_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${session_time}</p>
                        <p><strong>Type:</strong> ${session_type}</p>
                        <p><strong>Fees:</strong> $${fees}</p>
                        <p><strong>Description:</strong> ${description}</p>
                    `;
                    popup.classList.remove('hidden');
                })
                .catch(error => {
                    console.error('Error fetching session details:', error);
                });
        }


        document.querySelector('#session-details-popup').addEventListener('click', (event) => {
            if (event.target.id === 'session-details-popup') {
                document.getElementById('session-details-popup').classList.add('hidden');
            }
        });
    } else {
        console.log("No token found in localStorage.");
        document.getElementById('session-list').innerHTML = '<p>Please log in to view your upcoming sessions.</p>';
    }
});
