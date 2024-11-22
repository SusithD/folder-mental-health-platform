const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const axios = require('axios'); 
const router = express.Router();
require('dotenv').config();

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer token

    if (!token) {
        return res.status(403).json({ message: 'Access denied' });
    }

    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Attach the decoded user info to the request object
        req.user = decoded;
        next();
    });
};

// Route to get the user's profile details
router.get('/profile', verifyToken, (req, res) => {
    console.log("Received request for /profile");
    const userId = req.user.id;  // Get the user's ID from the decoded token

    // Query the database to get the user's full name
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

    // Use user_id from decoded token
    const user_id = req.user.id;

    if (!stress_level || !energy_level || !happiness_level) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Calculate the score (for simplicity, average the three levels)
    const score = (parseInt(stress_level) + parseInt(energy_level) + parseInt(happiness_level)) / 3;

    // Insert the assessment into the database
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
        LIMIT 1`; // Fetch the latest assessment

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results[0]); // Return the latest assessment
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

    // Insert the sleep data into the database
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
        LIMIT 1`; // Fetch the latest sleep data

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.json(results[0]); // Return the latest sleep data
        } else {
            return res.status(404).json({ message: 'No sleep data found' });
        }
    });
});


module.exports = router;