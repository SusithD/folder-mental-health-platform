const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();
const nodemailer = require('nodemailer');
const Joi = require('joi');
const crypto = require('crypto');


// Express route to verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (global.otpStore[email]) {
    const storedOtp = global.otpStore[email].otp;
    const otpExpiration = global.otpStore[email].otpExpiration;

    if (Date.now() > otpExpiration) {
      // OTP expired
      delete global.otpStore[email];
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (storedOtp === otp) {
      delete global.otpStore[email];
      return res.json({ success: true, message: 'OTP verified' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } else {
    return res.status(400).json({ message: 'OTP not sent or invalid' });
  }
});


// Express route to send OTP to email
router.post('/send-otp', (req, res) => {
  const { email } = req.body;

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiration = Date.now() + 5 * 60 * 1000;
  global.otpStore = global.otpStore || {};
  global.otpStore[email] = { otp, otpExpiration };

  // Send OTP via email
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
    from: `"Password Reset" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Password Reset',
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <p>Dear User,</p>

            <p>We have received a request to reset the password associated with your account. To proceed with the reset, please use the One-Time Password (OTP) provided below:</p>

            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; text-align: center;">
                <h2 style="margin: 0; color: #007BFF;">${otp}</h2>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">This OTP is valid for 5 minutes from the time it was sent.</p>
            </div>

            <p>If you did not request this password reset, please ignore this email. Your account will remain secure.</p>

            <p>For any assistance, feel free to contact our support team at <a href="mailto:support@example.com">support@example.com</a>.</p>

            <p>Thank you,<br>
            <strong>The Support Team</strong></p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #555;">
                This is an automated message. Please do not reply to this email. For inquiries, reach out to our support team at 
                <a href="mailto:support@example.com">support@example.com</a>.
            </p>
        </div>
    `,
  };


  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending OTP email:', error);
      return res.status(500).json({ message: 'Error sending OTP email' });
    }

    res.json({ success: true, message: 'OTP sent to your email' });
  });
});

// Register Route
router.post('/register', async (req, res) => {
  const {
    fullName, email, password, dob, gender,
    phone, emergencyContact, role, language,
    securityQuestion, securityAnswer, captchaToken
  } = req.body;

  // CAPTCHA Secret Key (replace with your actual secret key)
  const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

  const registerValidationSchema = Joi.object({
    fullName: Joi.string().min(3).max(100).required().messages({
      'string.empty': 'Full name is required.',
      'string.min': 'Full name must be at least 3 characters long.',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'A valid email address is required.',
      'string.empty': 'Email is required.',
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 6 characters long.',
    }),
    dob: Joi.date().iso().required().messages({
      'date.base': 'A valid date of birth is required.',
      'any.required': 'Date of birth is required.',
    }),
    gender: Joi.string().valid('male', 'female', 'other').required().messages({
      'any.only': 'Gender must be male, female, or other.',
    }),
    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid 10-digit number.',
      }),
    emergencyContact: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Emergency contact must be a valid 10-digit number.',
      }),
    role: Joi.string().default('user').valid('user', 'admin').messages({
      'any.only': 'Role must be either user or admin.',
    }),
    language: Joi.string().valid('english', 'sinhala', 'tamil').required().messages({
      'any.only': 'Language must be one of the allowed options (en, es, fr).',
      'string.empty': 'Language is required.',
    }),
    securityQuestion: Joi.string().min(5).required().messages({
      'string.empty': 'Security question is required.',
      'string.min': 'Security question must be at least 5 characters long.',
    }),
    securityAnswer: Joi.string().min(3).required().messages({
      'string.empty': 'Security answer is required.',
      'string.min': 'Security answer must be at least 3 characters long.',
    }),
    captchaToken: Joi.string().required().messages({
      'string.empty': 'CAPTCHA token is required.',
    }),

  });

  module.exports = registerValidationSchema;
  console.log(req.body);
  const { error } = registerValidationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    console.log(errorMessages);
    return res.status(400).json({ message: 'Validation failed', errors: errorMessages });
  }
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
              html: `
                  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                      <p>Dear <strong>${fullName}</strong>,</p>
          
                      <p>We are thrilled to welcome you to <strong>Mental Wellness Helper</strong>! By signing up, you’ve taken the first step towards a journey of self-care and mental well-being. Our team is here to support and guide you every step of the way.</p>
          
                      <p>At Mental Wellness Helper, we are dedicated to providing resources and personalised support to help you achieve your mental wellness goals. Feel free to explore our platform, connect with our expert therapists, and take advantage of the services designed to suit your unique needs.</p>
          
                      <p>If you have any questions or require assistance, please do not hesitate to reach out to us at <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>. We are here to help!</p>
          
                      <p>Thank you for choosing Mental Wellness Helper. We look forward to being a part of your journey to better mental health.</p>
          
                      <p>Warm regards,<br>
                      <strong>The Mental Wellness Helper Team</strong></p>
          
                      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                      <p style="font-size: 12px; color: #555;">
                          This is an automated message. Please do not reply to this email. For inquiries, contact our support team at 
                          <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>.
                      </p>
                  </div>
              `,
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

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  captchaResponse: Joi.string().required().messages({
    'any.required': 'CAPTCHA response is required',
  }),
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password, captchaResponse } = req.body;

  // Validate input data using Joi
  const { error } = loginSchema.validate({ email, password, captchaResponse });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

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

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

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
          subject: 'Login Alert: Your Account Activity Notification',
          html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <h2 style="color: #2c2c2c;">Hello ${user.fullName},</h2>
                  <p>We noticed a successful login to your account on <strong>Mental Wellness Helper</strong>. For your reference, here are the details of the login:</p>
                  <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                      <ul style="list-style: none; padding: 0; margin: 0;">
                          <li><strong>Email:</strong> ${email}</li>
                          <li><strong>Login Time:</strong> ${new Date().toLocaleString()}</li>
                          <li><strong>IP Address:</strong> ${user.ipAddress || 'Unavailable'}</li>
                      </ul>
                  </div>
      
                  <p>
                      If this login activity was initiated by you, no further action is required. However, if you suspect any unauthorized access to your account, 
                      we recommend securing your account immediately by resetting your password. You can do so by clicking the link below:
                  </p>
      
                  <p style="text-align: center; margin: 20px 0;">
                      <a href="${resetPasswordLink}" style="padding: 10px 20px; font-size: 16px; color: #fff; text-decoration: none; background-color: #007BFF; border-radius: 5px;">
                          Reset Password
                      </a>
                  </p>
      
                  <p>For any assistance or to report unusual activity, feel free to contact our support team at 
                      <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>.
                  </p>
      
                  <p>Thank you for choosing Mental Wellness Helper. Your security is our priority.</p>
                  <p style="margin-top: 20px;">Best regards,<br><strong>The Mental Wellness Helper Team</strong></p>
                  <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="font-size: 12px; color: #555;">This is an automated message. Please do not reply to this email. For inquiries, contact our support team at <a href="mailto:support@mentalwellnesshelper.com">support@mentalwellnesshelper.com</a>.</p>
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

module.exports = router;
