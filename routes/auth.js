const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const axios = require('axios'); 
const router = express.Router();
require('dotenv').config();


// Register Route
router.post('/register', async (req, res) => {
  const {
    fullName, email, password, dob, gender,
    phone, emergencyContact, role, language,
    securityQuestion, securityAnswer, captchaToken // Added CAPTCHA token
  } = req.body;

  // CAPTCHA Secret Key (replace with your actual secret key)
  const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

  try {
    // Verify CAPTCHA
    const captchaVerification = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: CAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!captchaVerification.data.success) {
      return res.status(400).json({ message: 'CAPTCHA validation failed' });
    }

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
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    res.status(500).json({ message: 'Error verifying CAPTCHA' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, captchaResponse } = req.body;

  // Verify CAPTCHA
  const secretKey = process.env.CAPTCHA_SECRET_KEY; 
  try {
      const captchaVerification = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
          params: {
              secret: secretKey,
              response: captchaResponse
          }
      });

      if (!captchaVerification.data.success) {
          return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
      }

      // Proceed with the login process if CAPTCHA is valid
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
  } catch (error) {
      console.error('CAPTCHA verification error:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

// Express route for forgot password - Get Security Question
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  // Query the database to get the user's security question
  const query = 'SELECT securityQuestion FROM users WHERE email = ?';
  db.query(query, [email], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Server error' });
      }

      if (result.length > 0) {
          return res.json({ success: true, securityQuestion: result[0].securityQuestion });
      } else {
          return res.status(404).json({ message: 'User not found' });
      }
  });
});


// Express route for verifying security answer
router.post('/verify-answer', (req, res) => {
    const { email, securityAnswer } = req.body;

    // Query the database to get the stored security answer
    const query = 'SELECT securityAnswer FROM users WHERE email = ?';
    db.query(query, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0 && result[0].securityAnswer === securityAnswer) {
            return res.json({ success: true });
        } else {
            return res.status(400).json({ message: 'Incorrect answer' });
        }
    });
});


// Express route for resetting password
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;

  // Hash the new password
  bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Server error' });
      }

      // Update the password in the database
      const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
      db.query(updateQuery, [hashedPassword, email], (err, result) => {
          if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Error updating password' });
          }

          res.json({ success: true, message: 'Password reset successfully' });
      });
  });
});



module.exports = router;
