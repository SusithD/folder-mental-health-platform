const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
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

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists in the database
  const findUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(findUserQuery, [email], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];

      // Compare the password with the hashed password stored in the database
      bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Server error' });
          }

          if (!isMatch) {
              return res.status(400).json({ message: 'Invalid password' });
          }

          // Generate JWT token
          const payload = {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
          };

          const token = jwt.sign(payload, 'your-secret-key', { expiresIn: '1h' });

          res.status(200).json({ message: 'Login successful', token });
      });
  });
});

module.exports = router;
