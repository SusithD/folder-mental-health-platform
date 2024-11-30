---

# **Mental Health Platform**

A comprehensive platform designed to support mental health care through tracking activities, offering resources, and providing professional assistance. This repository contains the codebase and documentation for the application.

---

## **Table of Contents**

1. [Overview](#overview)  
2. [Features](#features)  
3. [Technology Stack](#technology-stack)  
4. [Database Design](#database-design)  
5. [Setup and Installation](#setup-and-installation)  
6. [API Endpoints](#api-endpoints)  
7. [Usage](#usage)  
8. [Contributing](#contributing)  
9. [License](#license)

---

## **Overview**

This Mental Health Platform is a robust application aimed at providing users with tools to enhance their mental health. The platform enables activity tracking, mental health assessments, and the ability to connect with professionals. 

### **Purpose**
- To foster a supportive environment for mental health improvement.
- To provide a reliable database for tracking and analyzing user activities related to mental health.
- Offer a supportive environment to enhance mental health.
- Empower users with data-driven insights and progress tracking.
- Simplify scheduling and interaction with mental health professionals.

---

## **Features**

### **User Management**
- User registration and authentication (JWT-based).
- Secure sign-up with Google integration.

### **Activity Tracking**
- Log daily activities and emotions.
- Track progress over time with data visualizations.

### **Professional Assistance**
- Connect with certified mental health professionals.
- Schedule appointments and receive feedback.

### **Analytics**
- View insights based on user data.
- Advanced reporting features for trends and progress.

---

## **Technology Stack**

### **Frontend**
- **Framework**: HTML, JavaScript.  
- **Styling**: CSS / Bootstrap.

### **Backend**
- **Language**: Node.js  
- **Framework**: Express.js  
- **Authentication**: JSON Web Token (JWT)  
- **Database**: MySQL  
- **ORM**: Sequelize

### **Database**
- MySQL database for storing user data, activity logs, and professional information.
- Foreign key constraints ensure data integrity.

### **APIs and Libraries**
- **Google APIs**: For Sign-up with Google and Calendar integration.  
- **Nodemailer**: For sending email notifications.  
- **RESTful APIs**: All application features are exposed as REST APIs.

---

### **Database Design**

#### **Schema Overview**
The database is designed to manage user activity, session bookings, mental health assessments, therapy sessions, communication (chats and messages), sleep data, and journaling for a mental health and wellness application. The schema ensures data integrity, scalability, and efficient retrieval.

---

#### **Tables and Relationships**

1. **`users` Table**
   - **Purpose**: Stores user information, including personal details, authentication data, and preferences.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for each user.
     - `email`: User's email address.
     - `password`: Hashed password for authentication.
     - `role`: User's role (`user`, `counselor`, `admin`).
     - `is_anonymous`: Indicates if the user is anonymous.
     - `fullName`: Full name of the user.
     - `dob`: Date of birth.
     - `gender`: Gender of the user.
     - `phone`: Contact number (optional).
     - `emergencyContact`: Emergency contact number (optional).
     - `language`: Preferred language of the user.
     - `securityQuestion` and `securityAnswer`: For account recovery.
     - `created_at`: Timestamp when the user account was created.

2. **`activity_data` Table**
   - **Purpose**: Tracks users' physical activity and goals.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for the activity data entry.
     - `user_id` (Foreign Key): References `users.id`.
     - `steps_per_day`: Number of steps taken per day.
     - `calories_burned`: Calories burned per day.
     - `active_days`: Number of active days.
     - `most_active_day`: Day with the highest activity.
     - `inactive_days`: Days with no recorded activity.
     - `weekly_goal`: Weekly activity goal.
     - `created_at`: Timestamp of the activity record creation.

3. **`assessments` Table**
   - **Purpose**: Captures user self-assessments on mental health parameters.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for the assessment.
     - `user_id` (Foreign Key): References `users.id`.
     - `stress_level`: Self-reported stress level (1–10).
     - `energy_level`: Self-reported energy level (1–10).
     - `happiness_level`: Self-reported happiness level (1–10).
     - `score`: Composite score of the assessment.
     - `created_at`: Timestamp when the assessment was recorded.

4. **`bookings` Table**
   - **Purpose**: Manages session bookings and payment details.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for the booking.
     - `user_id` (Foreign Key): References `users.id`.
     - `session_id` (Foreign Key): References `sessions.session_id`.
     - `payment_method`: Payment method used.
     - `payment_status`: Status of the payment (`pending`, `completed`, `failed`).
     - `created_at`: Timestamp when the booking was made.

5. **`sessions` Table**
   - **Purpose**: Stores therapy session details.
   - **Columns**:
     - `session_id` (Primary Key): Unique identifier for the session.
     - `therapist_name`: Name of the therapist conducting the session.
     - `session_type`: Type of session (`in-person`, `online`).
     - `session_date`: Date of the session.
     - `session_time`: Time of the session.
     - `fees`: Session fees.
     - `description`: Description of the session content.

6. **`chats` Table**
   - **Purpose**: Facilitates real-time communication between users and counselors.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for the chat message.
     - `sender_id` (Foreign Key): References `users.id`.
     - `receiver_id` (Foreign Key): References `users.id`.
     - `message`: Text of the message.
     - `timestamp`: Timestamp of the message.

7. **`messages` Table**
   - **Purpose**: Logs messages exchanged between users and the support team.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for the message.
     - `user_id` (Foreign Key): References `users.id`.
     - `sender_type`: Type of sender (`user`, `support`).
     - `message`: Text of the message.
     - `created_at`: Timestamp of the message.

8. **`journals` Table**
   - **Purpose**: Allows users to maintain personal mental health journals.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for the journal entry.
     - `user_id` (Foreign Key): References `users.id`.
     - `entry`: Text of the journal entry.
     - `created_at`: Timestamp when the journal entry was created.

9. **`sleep_data` Table**
   - **Purpose**: Tracks users' sleep patterns and quality.
   - **Columns**:
     - `id` (Primary Key): Unique identifier for the sleep record.
     - `user_id` (Foreign Key): References `users.id`.
     - `average_sleep`: Average sleep duration.
     - `recommended_sleep`: Recommended sleep duration.
     - `last_night_sleep`: Sleep duration last night.
     - `sleep_quality`: Quality of sleep (1–10).
     - `deep_sleep`: Duration of deep sleep.
     - `sleep_consistency`: Consistency in sleep schedule.
     - `sleep_goal`: Sleep goals set by the user.
     - `created_at`: Timestamp when the sleep data was recorded.

---

#### **Key Relationships**
- `users.id` is a foreign key in `activity_data`, `assessments`, `bookings`, `chats`, `messages`, `journals`, and `sleep_data`.
- `sessions.session_id` is referenced by `bookings.session_id` to manage session bookings.
- `chats.sender_id` and `receiver_id` both reference `users.id` for tracking conversations.
- `messages.user_id` links messages to specific users.

---

#### **Additional Features**
- **Data Integrity**: The use of foreign keys ensures consistency across related tables.
- **Scalability**: The schema is designed to accommodate new features like additional activity tracking or session types.
- **Performance**: Indexing primary and foreign keys supports efficient querying.

---

## **Setup and Installation**

### **Prerequisites**
- Node.js (v16 or later)
- MySQL (v8 or later)
- Git
- npm or yarn

### **Installation Steps**
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mental-health-platform.git
   cd mental-health-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env` file in the root directory with the following details:
   ```
   DB_HOST=your-database-host
   DB_USER=your-database-username
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   JWT_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Run database migrations**
   ```bash
   npx sequelize-cli db:migrate
   ```

5. **Start the application**
   ```bash
   npm start
   ```

---

## **API Endpoints**

### **Authentication**
- **POST** `/api/auth/register`: Register a new user.  
- **POST** `/api/auth/login`: Authenticate an existing user.
- **POST** `/api/auth/verify-otp`: Express route to verify OTP.
- **POST** `/api/auth/send-otp`: Express route to send OTP to email.
- **POST** `/api/auth/forgot-password`: Express route for forgot password - Get Security Question.
- **POST** `/api/auth/verify-answer`: Express route for verifying security answer.
- **POST** `/api/auth/reset-password`: Reset Password Route.

### **Activities**
- **GET** `/api/user/profile`: Get user details from the database.  
- **POST** `/api/user/assessments`: Route to handle assessment submissions.
- **GET** `/api/user/assessment-result`: Route to fetch assessments for the logged-in user.
- **POST** `/api/user/sleep`: Route to submit sleep data.
- **GET** `/api/user/sleep-data`: Route to fetch the latest sleep data for the logged-in user.
- **POST** `/api/user/activity`: Route to handle activity data submission.
- **GET** `/api/user/activity-data`: Fetch the latest activity data.
- **POST** `/api/user/journals`: Route to handle journal data submission.
- **GET** `/api/user/journals-data`: Fetch the latest journal data.
- **GET** `/api/user/sessions`: Route to fetch all sessions.
- **GET** `/api/user/sessions/:id`: Route to fetch a single session by ID.
- **POST** `/api/user/book-session`: Route to handle session booking data submission.
- **GET** `/api/user/user-details`: Route to fetch user details.
- **GET** `/api/user/booked-sessions`: Route to fetch booked sessions for the authenticated user.
- **DELETE** `/api/user/booked-sessions/:sessionId`: Route to cancel a booked session for the authenticated user.

### **Appointments**
- **POST** `/api/appointments`: Schedule an appointment.  
- **GET** `/api/appointments`: Retrieve appointments for a user.

---

## **Usage**

1. **Sign Up**: Create an account or sign up using Google.  
2. **Track Activities**: Log daily activities and emotions.  
3. **Analytics**: View insights on your mental health progress.  
4. **Professional Support**: Book appointments with mental health professionals.

---

## **Contributing**

We welcome contributions to enhance this platform!  

### **How to Contribute**
1. Fork the repository.  
2. Create a new branch (`git checkout -b feature-branch`).  
3. Commit your changes (`git commit -m "Add a feature"`).  
4. Push to the branch (`git push origin feature-branch`).  
5. Open a pull request.

---
