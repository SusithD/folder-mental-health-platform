const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Import your database connection (MySQL)
const router = express.Router();

// Register Route
router.post('/register', (req, res) => {
  const {
    fullName, email, password, dob, gender,
    phone, emergencyContact, role, language,
    securityQuestion, securityAnswer
  } = req.body;

  // Check if user exists
  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUserQuery, [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
      }

      // Insert new user into the database
      const insertUserQuery = `
        INSERT INTO users (fullName, email, password, dob, gender, phone, emergencyContact, role, language, securityQuestion, securityAnswer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertUserQuery, [fullName, email, hashedPassword, dob, gender, phone, emergencyContact, role || 'user', language, securityQuestion, securityAnswer], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error saving user' });
        }

        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
});

// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find user in the database
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result[0];

    // Compare password with hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error comparing passwords' });
      }

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ token, message: 'Login successful' });
    });
  });
});

module.exports = router;
