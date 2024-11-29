document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is fully loaded");

    const token = localStorage.getItem('authToken');
    console.log("Token:", token);

    if (token) {

        fetchBookedSessions(token);

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
        
        axios.get('http://localhost:3000/api/user/sessions', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                const sessions = response.data;
                const sessionListElement = document.getElementById('session-list');
                sessionListElement.innerHTML = '';


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
                        <button class="btn book-session" data-session-id="${sessionId}">Book Session</button>
                    `;
                    popup.classList.remove('hidden');
                })
                .catch(error => {
                    console.error('Error fetching session details:', error);
                });
        }

        function bookSession(sessionId) {
            // Enhanced booking form with more professional details and styling
            const bookingForm = `
                <h3>Confirm Booking</h3>
                <p><strong>Session ID:</strong> ${sessionId}</p>
                <p><strong>Session Date:</strong> <span id="session-date">Fetching...</span></p>
                <p><strong>Therapist:</strong> <span id="therapist-name">Fetching...</span></p>
                <p><strong>Fees:</strong> $<span id="session-fees">0.00</span></p>
        
                <label for="payment-method"><strong>Select Payment Method:</strong></label>
                <select id="payment-method">
                    <option value="credit-card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                </select>
        
                <div id="payment-details" class="payment-details"></div>
        
                <div class="terms-and-conditions">
                    <label>
                        <input type="checkbox" id="terms-checkbox" required />
                        I agree to the <a href="/terms" target="_blank">Terms and Conditions</a>.
                    </label>
                </div>
        
                <div class="privacy-policy">
                    <label>
                        <input type="checkbox" id="privacy-checkbox" required />
                        I agree to the <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
                    </label>
                </div>
        
                <button class="btn confirm-booking" data-session-id="${sessionId}">Confirm Booking</button>
            `;
            const popup = document.getElementById('session-details-popup');
            popup.querySelector('.popup-content').innerHTML = bookingForm;

            // Fetch and display session details (e.g., therapist name, session date, and fees)
            fetchSessionDetails(sessionId);

            // Add event listener for payment method selection
            document.getElementById('payment-method').addEventListener('change', (event) => {
                const method = event.target.value;
                const paymentDetailsDiv = document.getElementById('payment-details');

                if (method === 'credit-card') {
                    paymentDetailsDiv.innerHTML = `
                        <h4>Credit Card Details</h4>
                        <label for="card-number">Card Number:</label>
                        <input type="text" id="card-number" placeholder="1234 5678 1234 5678" required />
        
                        <label for="expiry-date">Expiry Date:</label>
                        <input type="text" id="expiry-date" placeholder="MM/YY" required />
        
                        <label for="cvv">CVV:</label>
                        <input type="password" id="cvv" placeholder="123" required />
                    `;
                } else if (method === 'paypal') {
                    paymentDetailsDiv.innerHTML = `
                        <h4>PayPal Payment</h4>
                        <p>You will be redirected to PayPal to complete the payment. Please ensure you have a valid PayPal account.</p>
                    `;
                }
            });

            // Attach confirm booking functionality
            document.querySelector('.confirm-booking').addEventListener('click', () => confirmBooking(sessionId));
        }

        // Function to fetch session details from the server
        function fetchSessionDetails(sessionId) {
            axios.get(`http://localhost:3000/api/user/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(response => {
                    const session = response.data;
                    const { therapist_name, session_date, fees } = session;
                    // Display the fetched details in the form
                    document.getElementById('session-date').textContent = new Date(session_date).toLocaleDateString();
                    document.getElementById('therapist-name').textContent = therapist_name;
                    document.getElementById('session-fees').textContent = fees;
                })
                .catch(error => {
                    console.error('Error fetching session details:', error);
                    // Display a fallback error message if session details cannot be fetched
                    document.getElementById('session-date').textContent = 'Unavailable';
                    document.getElementById('therapist-name').textContent = 'Unavailable';
                    document.getElementById('session-fees').textContent = '0.00';
                });
        }

        function fetchBookedSessions(token) {
            axios.get('http://localhost:3000/api/user/booked-sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(response => {
                    const sessions = response.data;
                    const bookedSessionList = document.getElementById('booked-session-list');
                    bookedSessionList.innerHTML = '';
        
                    if (sessions.length === 0) {
                        bookedSessionList.innerHTML = '<p>No booked sessions available.</p>';
                    } else {
                        sessions.forEach(session => {
                            const { therapist_name, session_date, session_time, session_type, session_id } = session;
        
                            const sessionCard = document.createElement('div');
                            sessionCard.classList.add('session-card');
                            sessionCard.innerHTML = `
                                <h3>Therapy with ${therapist_name}</h3>
                                <p><strong>Date:</strong> ${new Date(session_date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> ${session_time}</p>
                                <p><strong>Type:</strong> ${session_type}</p>
                                <button class="btn cancel-session" data-session-id="${session_id}">Cancel</button>
                            `;
                            bookedSessionList.appendChild(sessionCard);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching booked sessions:', error);
                    document.getElementById('booked-session-list').innerHTML = '<p>Error fetching booked sessions.</p>';
                });
        }

        function cancelSession(sessionId, token) {
            if (confirm("Are you sure you want to cancel this session?")) {
                axios.delete(`http://localhost:3000/api/user/booked-sessions/${sessionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(() => {
                        alert("Session cancelled successfully.");
                        fetchBookedSessions(token);
                    })
                    .catch(error => {
                        console.error('Error cancelling session:', error);
                        alert("Failed to cancel the session. Please try again.");
                    });
            }
        }

        function confirmBooking(sessionId) {
            const paymentMethod = document.getElementById('payment-method').value;
            const paymentDetails = {};

            if (paymentMethod === 'credit-card') {
                paymentDetails.cardNumber = document.getElementById('card-number').value;
                paymentDetails.expiryDate = document.getElementById('expiry-date').value;
                paymentDetails.cvv = document.getElementById('cvv').value;
            }

            // Post booking and payment details to the server
            axios.post(
                `http://localhost:3000/api/user/book-session`,
                {
                    sessionId,
                    paymentMethod,
                    paymentDetails,
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            )
                .then(response => {
                    const message = response.data.message;
                    const popup = document.getElementById('session-details-popup');
                    popup.querySelector('.popup-content').innerHTML = `
            <h3>Session Successfully Booked!</h3>
            <p>${message}</p>

        `;
                    
                    popup.classList.remove('hidden');
                })
                .catch(error => {
                    console.error('Error booking session:', error);

                    if (error.response && error.response.data) {
                        alert(`Error: ${error.response.data.message}`);
                    } else {
                        alert('An unexpected error occurred. Please try again.');
                    }
                });
        }

        document.querySelector('#session-details-popup').addEventListener('click', (event) => {
            if (event.target.id === 'session-details-popup') {
                document.getElementById('session-details-popup').classList.add('hidden');
            }
        });

        document.getElementById('session-details-popup').addEventListener('click', (event) => {
            if (event.target.classList.contains('book-session')) {
                const sessionId = event.target.getAttribute('data-session-id');
                bookSession(sessionId);
            }
        });

        // Add event listener for cancelling sessions
        document.getElementById('booked-session-list').addEventListener('click', (event) => {
            if (event.target.classList.contains('cancel-session')) {
                const sessionId = event.target.getAttribute('data-session-id');
                cancelSession(sessionId, token);
            }
        });

    } else {
        console.log("No token found in localStorage.");
        document.getElementById('session-list').innerHTML = '<p>Please log in to view your upcoming sessions.</p>';
    }
});
