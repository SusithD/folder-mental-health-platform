const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const axios = require('axios'); 
const router = express.Router();
require('dotenv').config();
const nodemailer = require('nodemailer');


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
      bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Server error' });
        }

        // Insert new user into the database
        const insertUserQuery = `
          INSERT INTO users (fullName, email, password, dob, gender, phone, emergencyContact, role, language, securityQuestion, securityAnswer)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(insertUserQuery, [fullName, email, hashedPassword, dob, gender, phone, emergencyContact, role || 'user', language, securityQuestion, securityAnswer], async (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error saving user' });
          }

          // Send Welcome Email
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.EMAIL_SERVICE,
              port: 587,
              secure: false, // true for 465, false for other ports
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, 
              },
            });

            const mailOptions = {
              from: `"Mental Wellness Helper" <${process.env.EMAIL_USER}>`,
              to: email,
              subject: 'Welcome to Mental Wellness Helper',
              text: `Dear ${fullName},\n\nThank you for signing up with Mental Wellness Helper. We are excited to have you on board.\n\nBest Regards,\nThe Mental Wellness Helper Team`,
              html: `<p>Dear ${fullName},</p><p>Thank you for signing up with <b>Mental Wellness Helper</b>. We are excited to have you on board.</p><p>Best Regards,<br>The Mental Wellness Helper Team</p>`,
            };

            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'User registered successfully and welcome email sent' });
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            res.status(201).json({ message: 'User registered successfully but failed to send email' });
          }
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
    const captchaVerification = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: captchaResponse,
        },
      }
    );

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
      bcrypt.compare(password, user.password, async (err, isMatch) => {
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
          subject: 'Login Notification',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #2c2c2c;">Hello ${user.fullName},</h2>
              <p>We noticed a successful login to your account on <b>Mental Wellness Helper</b>.</p>
              <p>If this was you, no further action is required. If you didn’t log in, please secure your account immediately by resetting your password.</p>
              <p>Here are the details of the login:</p>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Login Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              <p>Thank you for being a valued member of our community.</p>
              <p style="margin-top: 20px;">Best regards,<br>The Mental Wellness Helper Team</p>
            </div>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log('Login notification email sent');
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }

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


// Reset Password Route
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;

  // Hash the new password
  bcrypt.hash(newPassword, 10, async (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }

    // Update the password in the database
    const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
    db.query(updateQuery, [hashedPassword, email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error updating password' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Send email notification about the password reset
      try {
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
          subject: 'Your Password Has Been Reset',
          text: `Hello,\n\nYour password has been successfully reset. If you did not request this change, please contact our support team immediately.\n\nBest Regards,\nThe Mental Wellness Helper Team`,
          html: `
            <p>Hello,</p>
            <p>Your password has been successfully reset. If you did not request this change, please contact our support team immediately.</p>
            <p>Best Regards,<br>The Mental Wellness Helper Team</p>
          `,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Password reset successfully and email sent' });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        res.json({ success: true, message: 'Password reset successfully but email notification failed' });
      }
    });
  });
});



module.exports = router;
