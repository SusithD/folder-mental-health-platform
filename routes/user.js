const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();
const nodemailer = require('nodemailer');

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        return res.status(403).json({ message: 'Access denied' });
    }

    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = decoded;
        next();
    });
};

// Route to get the user's profile details
router.get('/profile', verifyToken, (req, res) => {
    console.log("Received request for /profile");
    const userId = req.user.id;  

    const query = 'SELECT fullName FROM users WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0) {
            return res.json({ fullName: result[0].fullName });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    });
});

// Route to handle assessment submissions
router.post('/assessments', verifyToken, (req, res) => {
    const { stress_level, energy_level, happiness_level } = req.body;

    const user_id = req.user.id;

    if (!stress_level || !energy_level || !happiness_level) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const score = (parseInt(stress_level) + parseInt(energy_level) + parseInt(happiness_level)) / 3;

    const query = 'INSERT INTO assessments (user_id, stress_level, energy_level, happiness_level, score) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [user_id, stress_level, energy_level, happiness_level, score], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving assessment', error: err });
        }
        res.status(201).json({ message: 'Assessment saved successfully' });
    });
});

// Route to fetch assessments for the logged-in user
router.get('/assessment-result', verifyToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT stress_level, energy_level, happiness_level, score, created_at
        FROM assessments
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1`; 

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results[0]); 
        } else {
            return res.status(404).json({ message: 'No assessments found' });
        }
    });
});

// Route to submit sleep data
router.post('/sleep', verifyToken, (req, res) => {
    const { average_sleep, recommended_sleep, last_night_sleep, sleep_quality, deep_sleep, sleep_consistency, sleep_goal } = req.body;

    const user_id = req.user.id;

    if (!average_sleep || !recommended_sleep || !last_night_sleep || !sleep_quality || !deep_sleep || !sleep_consistency || !sleep_goal) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const query = 'INSERT INTO sleep_data (user_id, average_sleep, recommended_sleep, last_night_sleep, sleep_quality, deep_sleep, sleep_consistency, sleep_goal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [user_id, average_sleep, recommended_sleep, last_night_sleep, sleep_quality, deep_sleep, sleep_consistency, sleep_goal], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving sleep data', error: err });
        }
        res.status(201).json({ message: 'Sleep data saved successfully' });
    });
});

// Route to fetch the latest sleep data for the logged-in user
router.get('/sleep-data', verifyToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT average_sleep, recommended_sleep, last_night_sleep, sleep_quality, deep_sleep, sleep_consistency, sleep_goal, created_at
        FROM sleep_data
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1`; 

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results[0]); 
        } else {
            return res.status(404).json({ message: 'No sleep data found' });
        }
    });
});


// Route to handle activity data submission
router.post('/activity', verifyToken, (req, res) => {
    const { steps_per_day, calories_burned, active_days, most_active_day, inactive_days, weekly_goal } = req.body;

    const user_id = req.user.id;

    if (!steps_per_day || !calories_burned || !active_days || !most_active_day || !inactive_days || !weekly_goal) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const query = `
        INSERT INTO activity_data (user_id, steps_per_day, calories_burned, active_days, most_active_day, inactive_days, weekly_goal)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [user_id, steps_per_day, calories_burned, active_days, most_active_day, inactive_days, weekly_goal], (err, result) => {
        if (err) {
            console.error('Error saving activity data:', err);
            return res.status(500).json({ message: 'Error saving activity data', error: err });
        }
        res.status(201).json({ message: 'Activity data saved successfully' });
    });
});


// Fetch the latest activity data
router.get('/activity-data', verifyToken, (req, res) => {
    const user_id = req.user.id;

    const query = `
        SELECT steps_per_day, calories_burned, active_days, most_active_day, inactive_days, weekly_goal, created_at
        FROM activity_data
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1`;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results[0]);
        } else {
            return res.status(404).json({ message: 'No activity data found' });
        }
    });
});

router.post('/journals', verifyToken, (req, res) => {
    const userId = req.user.id;
    const { entry } = req.body;

    if (!entry) {
        return res.status(400).json({ message: 'Journal entry cannot be empty.' });
    }

    const query = 'INSERT INTO journals (user_id, entry) VALUES (?, ?)';
    db.query(query, [userId, entry], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error saving journal entry.' });
        }
        res.status(201).json({ message: 'Journal entry saved successfully.' });
    });
});


router.get('/journals', verifyToken, (req, res) => {
    const userId = req.user.id;

    const query = 'SELECT id, entry, created_at FROM journals WHERE user_id = ? ORDER BY created_at DESC';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching journal entries.' });
        }
        res.json(results);
    });
});

// Route to fetch all sessions
router.get('/sessions', verifyToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT session_id, therapist_name, session_type, session_date, session_time, fees, description
        FROM sessions
        ORDER BY session_date DESC, session_time DESC`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results); 
        } else {
            return res.status(404).json({ message: 'No sessions found' });
        }
    });
});

// Route to fetch a single session by ID
router.get('/sessions/:id', verifyToken, (req, res) => {
    const sessionId = req.params.id;

    const query = `
        SELECT session_id, therapist_name, session_type, session_date, session_time, fees, description
        FROM sessions
        WHERE session_id = ?`;

    db.query(query, [sessionId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results[0]); 
        } else {
            return res.status(404).json({ message: 'Session not found' });
        }
    });
});

router.post('/book-session', verifyToken, async (req, res) => {
    const { sessionId, paymentMethod, paymentDetails } = req.body;
    const user_id = req.user.id;

    if (!sessionId || !paymentMethod) {
        return res.status(400).json({ message: 'Session ID and payment method are required' });
    }

    const querySession = 'SELECT * FROM sessions WHERE session_id = ?';
    db.query(querySession, [sessionId], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching session details', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = results[0];

        let paymentSuccess = false;
        if (paymentMethod === 'credit-card' && paymentDetails) {
            paymentSuccess = processCreditCard(paymentDetails);
        } else if (paymentMethod === 'paypal') {
            paymentSuccess = processPayPal();
        }

        if (!paymentSuccess) {
            return res.status(400).json({ message: 'Payment failed. Please check your payment details and try again.' });
        }

        const insertBookingQuery = `
            INSERT INTO bookings (user_id, session_id, payment_method, payment_status)
            VALUES (?, ?, ?, 'completed')
        `;
        db.query(insertBookingQuery, [user_id, sessionId, paymentMethod], async (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving booking', error: err });
            }

            try {
                // Fetch user details for the email
                const userQuery = 'SELECT email, fullName FROM users WHERE id = ?';
                db.query(userQuery, [user_id], async (err, userResult) => {
                    if (err || userResult.length === 0) {
                        console.error('Error fetching user details:', err);
                        return res.status(201).json({ 
                            message: 'Booking confirmed and payment successful, but email notification failed.' 
                        });
                    }

                    const { email, fullName } = userResult[0];

                    // Send email notification
                    const transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_SERVICE,
                        port: 587,
                        secure: false, 
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    });

                    const mailOptions = {
                        from: `"Mental Wellness Helper" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: 'Your Session Booking Confirmation',
                        html: `
                            <div style="font-family: Arial, sans-serif; color: #333;">
                                <p>Dear <strong>${fullName}</strong>,</p>
                    
                                <p>We are delighted to inform you that your session booking has been successfully confirmed! Below are the details of your session:</p>
                    
                                <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                                    <h3 style="margin-bottom: 10px; color: #007BFF;">Session Details</h3>
                                    <ul style="list-style: none; padding: 0;">
                                        <li><strong>Session ID:</strong> ${session.session_id}</li>
                                        <li><strong>Therapist Name:</strong> ${session.therapist_name}</li>
                                        <li><strong>Session Type:</strong> ${session.session_type}</li>
                                        <li><strong>Session Fee:</strong> ${session.fees} (Paid)</li>
                                        <li><strong>Date:</strong> ${session.session_date}</li>
                                        <li><strong>Time:</strong> ${session.session_time}</li>
                                        <li><strong>Payment Method:</strong> ${paymentMethod}</li>
                                    </ul>
                                </div>
                    
                                <p>Your therapist will be prepared to provide the best care and guidance during this session. Please make sure to arrive at least 10 minutes early for any pre-session preparations.</p>
                    
                                <p><strong>Need to reschedule or cancel?</strong><br>
                                If you need to make changes to your booking, please contact us at least 24 hours in advance to avoid any cancellation fees. You can reach us at <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>.</p>
                    
                                <p><strong>Reminder:</strong> If this is your first session with us, kindly ensure you complete any required pre-session forms sent to your email earlier.</p>
                    
                                <p>If you have any questions or require further assistance, feel free to contact our support team. We’re here to help!</p>
                    
                                <p>Thank you for choosing Mental Wellness Helper. We look forward to supporting you on your journey to better mental health.</p>
                    
                                <p>Warm regards,<br>
                                <strong>The Mental Wellness Helper Team</strong></p>
                    
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                                <p style="font-size: 12px; color: #555;">
                                    This is an automated message. Please do not reply to this email. For inquiries, reach out to our support team at 
                                    <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>.
                                </p>
                            </div>
                        `,
                    };
                    

                    await transporter.sendMail(mailOptions);
                    res.status(201).json({ message: 'Booking confirmed, payment successful, and email sent' });
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                res.status(201).json({ 
                    message: 'Booking confirmed and payment successful, but email notification failed.' 
                });
            }
        });
    });
});

router.get('/user-details', verifyToken, (req, res) => {
    const userId = req.user.id; 

    const query = `
        SELECT fullName, email, dob, gender, phone, emergencyContact, language
        FROM users
        WHERE id = ?`; 

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results[0]); 
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    });
});

// Route to fetch booked sessions for the authenticated user
router.get('/booked-sessions', verifyToken, (req, res) => {
    const userId = req.user.id; 

    const query = `
        SELECT bs.id AS booking_id, s.therapist_name, s.session_date, s.session_time, s.session_type, s.session_id
        FROM bookings AS bs
        INNER JOIN sessions AS s ON bs.session_id = s.session_id
        WHERE bs.user_id = ?
        ORDER BY s.session_date DESC, s.session_time DESC`;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching booked sessions:', err);
            return res.status(500).json({ message: 'Error fetching booked sessions' });
        }

        res.json(results);
    });
});

// Route to cancel a booked session for the authenticated user
router.delete('/booked-sessions/:sessionId', verifyToken, (req, res) => {
    const userId = req.user.id; 
    const sessionId = req.params.sessionId; 

    const query = `
        DELETE FROM bookings
        WHERE user_id = ? AND session_id = ?`;
    
    db.query(query, [userId, sessionId], (err, result) => {
        if (err) {
            console.error('Error cancelling booked session:', err);
            return res.status(500).json({ message: 'Error cancelling booked session' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Session not found or already cancelled' });
        }

        // Fetch the session details for email
        const sessionQuery = 'SELECT * FROM sessions WHERE session_id = ?';
        db.query(sessionQuery, [sessionId], (err, sessionResult) => {
            if (err) {
                console.error('Error fetching session details:', err);
                return res.status(500).json({ message: 'Error fetching session details' });
            }

            if (sessionResult.length === 0) {
                return res.status(404).json({ message: 'Session not found' });
            }

            const session = sessionResult[0];
            const email = req.user.email;  // User's email
            const fullName = req.user.fullName; // User's full name

            // Create the email content
            const mailOptions = {
                from: `"Mental Wellness Helper" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Session Cancellation Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <p>Dear <strong>${fullName}</strong>,</p>

                        <p>We are writing to confirm that your session booking has been successfully cancelled. Below are the details of the cancelled session:</p>

                        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                            <h3 style="margin-bottom: 10px; color: #007BFF;">Cancelled Session Details</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Session ID:</strong> ${sessionId}</li>
                                <li><strong>Therapist Name:</strong> ${session.therapist_name}</li>
                                <li><strong>Session Type:</strong> ${session.session_type}</li>
                                <li><strong>Session Fee:</strong> ${session.fees}</li>
                                <li><strong>Date:</strong> ${session.session_date}</li>
                                <li><strong>Time:</strong> ${session.session_time}</li>
                            </ul>
                        </div>

                        <p>We understand that plans can change, and we hope to have the opportunity to reschedule your session at a more convenient time. Should you wish to book a new session, please visit our platform or contact us directly for assistance.</p>

                        <p><strong>Need assistance or have questions?</strong><br>If you have any further inquiries or if you'd like to reschedule, please feel free to reach out to us at <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>.</p>

                        <p>Thank you for choosing Mental Wellness Helper. We are here to support you on your mental health journey, and we look forward to connecting with you soon.</p>

                        <p>Warm regards,<br>
                        <strong>The Mental Wellness Helper Team</strong></p>

                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                        <p style="font-size: 12px; color: #555;">
                            This is an automated message. Please do not reply to this email. For inquiries, reach out to our support team at 
                            <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>.
                        </p>
                    </div>
                `,
            };

            // Send the cancellation confirmation email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            transporter.sendMail(mailOptions, (emailErr, info) => {
                if (emailErr) {
                    console.error('Error sending email:', emailErr);
                    return res.status(500).json({ message: 'Error sending confirmation email' });
                }

                console.log('Email sent: ' + info.response);
                // Respond to the user
                res.json({ message: 'Session cancelled successfully and confirmation email sent' });
            });
        });
    });
});


function processPayPal() {
    console.log("Processing PayPal payment...");
    return true; 
}

function processCreditCard(paymentDetails) {
    console.log("Processing credit card payment with details:", paymentDetails);
    return true;
}

module.exports = router;