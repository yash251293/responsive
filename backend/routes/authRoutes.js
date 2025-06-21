const express = require('express');
const bcrypt = require('bcryptjs');    // Requires npm install
const jwt = require('jsonwebtoken'); // Requires npm install
const db = require('../db');         // Assumes db/index.js and pg (requires npm install)
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Added authMiddleware import

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    email,
    password,
    user_type, // 'individual' or 'company'
    full_name, // For individual
    company_name, // For company
    industry, // For company
    company_size // For company
  } = req.body;

  // Basic Input Validation
  if (!email || !password || !user_type) {
    return res.status(400).json({ message: 'Email, password, and user type are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  if (!['individual', 'company'].includes(user_type)) {
    return res.status(400).json({ message: 'Invalid user type. Must be "individual" or "company".' });
  }
  if (user_type === 'individual' && !full_name) {
    return res.status(400).json({ message: 'Full name is required for individual users.' });
  }
  if (user_type === 'company' && !company_name) {
    return res.status(400).json({ message: 'Company name is required for company users.' });
  }

  try {
    // Check if user already exists
    const existingUserCheck = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existingUserCheck.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user into database
    let insertQuery;
    let queryParams;
    if (user_type === 'individual') {
      insertQuery = `
        INSERT INTO users (email, password_hash, user_type, full_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, user_type, full_name, created_at;
      `;
      queryParams = [email, password_hash, user_type, full_name];
    } else { // company
      insertQuery = `
        INSERT INTO users (email, password_hash, user_type, company_name, industry, company_size)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, user_type, company_name, created_at;
      `;
      queryParams = [email, password_hash, user_type, company_name, industry, company_size];
    }

    const newUserResult = await db.query(insertQuery, queryParams);
    const newUser = newUserResult.rows[0];

    res.status(201).json({
      message: 'User registered successfully!',
      user: newUser
    });

  } catch (error) {
    console.error('Detailed error during registration:', error); // Log the full error object

    if (error.code) { // Check if it's a pg error with a code
      console.error(`Database Error Code: ${error.code}, Routine: ${error.routine}`); // Log more pg details
      if (error.code === '23505') {
         return res.status(409).json({ message: 'User with this email already exists (database constraint).' });
      }
      // Example pg connection error codes:
      // '08001' - sqlclient_unable_to_establish_sqlconnection
      // '08006' - connection_failure
      // '28P01' - invalid_password (for DB user)
      // Add more specific checks if certain pg error codes are common for connection issues
      if (['08001', '08006', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEOUT'].includes(error.code) ||
          (error.message && (error.message.toLowerCase().includes('connect econrefused') || // Note: ECONNREFUSED is typically error.syscall or error.code for network errors, not error.message directly for pg
                             error.message.toLowerCase().includes('timeout') ||
                             error.message.toLowerCase().includes('database system is starting up')))) {
        return res.status(503).json({ message: 'Database connection error or database unavailable. Please try again later.' });
      }
      return res.status(500).json({ message: 'A database error occurred during registration. Please check server logs.'});
    }

    // Default server error if not a recognizable DB error
    res.status(500).json({ message: 'Server error during registration. Please check server logs for more details.' });
  }
});

// POST /api/auth/mark-as-verified - Mark user's contact (phone) as verified
// Protected route: Requires authentication
router.post('/mark-as-verified', authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;

  // Potentially, the request body could indicate what was verified, e.g., { method: 'phone' }
  // For now, we assume it's phone verification as per the plan.

  try {
    const updateQuery = `
      UPDATE users
      SET is_phone_verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, is_phone_verified, user_type, full_name, company_name;
    `; // Added more fields to RETURNING for context if needed by frontend
    const { rows } = await db.query(updateQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found to mark as verified.' });
    }

    res.status(200).json({
      message: 'User contact method marked as verified successfully.',
      user: rows[0] // Contains id, email, is_phone_verified, and other returned fields
    });
  } catch (error) {
    console.error('Error marking user as verified:', error);
    const err = new Error('Server error while marking user as verified.');
    // err.statusCode = 500; // Global error handler might set this.
    next(err); // Pass to global error handler
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Retrieve user by email
    const userResult = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const user = userResult.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // User matched, create JWT
    const payload = {
      userId: user.id,
      userType: user.user_type,
      email: user.email
      // Add other relevant non-sensitive info if needed
    };

    // Sign token
    // Ensure JWT_SECRET and JWT_EXPIRES_IN are in your .env file
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } // Default to 1 hour if not set
    );

    // Fetch the full user details, including profile, similar to /users/me
    const fullUserQuery = `
      SELECT
        u.id, u.email, u.user_type, u.full_name, u.company_name, u.industry, u.company_size,
        u.is_email_verified, u.is_phone_verified,
        u.created_at AS user_created_at, u.updated_at AS user_updated_at,
        up.location, up.professional_title, up.years_of_experience, up.job_function,
        up.key_skills, up.education_level, up.field_of_study, up.institution,
        up.linkedin_url, up.website_url, up.bio, up.company_type, up.tech_stack,
        up.created_at AS profile_created_at, up.updated_at AS profile_updated_at,
        up.job_status, up.desired_roles, up.work_arrangement, up.experience_level_preference,
        up.salary_expectation_min, up.salary_expectation_max, up.salary_expectation_currency,
        up.career_goals, up.preferred_locations,
        up.hiring_status, up.offered_employment_types, up.hiring_roles, up.hiring_locations,
        up.hiring_salary_min, up.hiring_salary_max, up.hiring_salary_currency,
        up.culture_preferences, up.remote_policy_importance, up.quiet_office_importance,
        up.ideal_next_job_description,
        up.resume_file_path
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1;
    `;
    const { rows: fullUserRows } = await db.query(fullUserQuery, [user.id]);
    if (fullUserRows.length === 0) {
      // Should not happen if user was just retrieved, but as a safeguard
      return res.status(500).json({ message: 'Error fetching full user details after login.' });
    }
    const fullUserData = fullUserRows[0];
    const userResponse = {
      id: fullUserData.id,
      email: fullUserData.email,
      user_type: fullUserData.user_type,
      full_name: fullUserData.full_name,
      company_name: fullUserData.company_name,
      industry: fullUserData.industry,
      company_size: fullUserData.company_size,
      is_email_verified: fullUserData.is_email_verified,
      is_phone_verified: fullUserData.is_phone_verified,
      user_created_at: fullUserData.user_created_at,
      user_updated_at: fullUserData.user_updated_at,
      profile: {
        location: fullUserData.location,
        professional_title: fullUserData.professional_title,
        years_of_experience: fullUserData.years_of_experience,
        job_function: fullUserData.job_function,
        key_skills: fullUserData.key_skills,
        education_level: fullUserData.education_level,
        field_of_study: fullUserData.field_of_study,
        institution: fullUserData.institution,
        linkedin_url: fullUserData.linkedin_url,
        website_url: fullUserData.website_url,
        bio: fullUserData.bio,
        company_type: fullUserData.company_type,
        tech_stack: fullUserData.tech_stack,
        profile_created_at: fullUserData.profile_created_at,
        profile_updated_at: fullUserData.profile_updated_at,
        job_status: fullUserData.job_status,
        desired_roles: fullUserData.desired_roles,
        work_arrangement: fullUserData.work_arrangement,
        experience_level_preference: fullUserData.experience_level_preference,
        salary_expectation_min: fullUserData.salary_expectation_min,
        salary_expectation_max: fullUserData.salary_expectation_max,
        salary_expectation_currency: fullUserData.salary_expectation_currency,
        career_goals: fullUserData.career_goals,
        preferred_locations: fullUserData.preferred_locations,
        hiring_status: fullUserData.hiring_status,
        offered_employment_types: fullUserData.offered_employment_types,
        hiring_roles: fullUserData.hiring_roles,
        hiring_locations: fullUserData.hiring_locations,
        hiring_salary_min: fullUserData.hiring_salary_min,
        hiring_salary_max: fullUserData.hiring_salary_max,
        hiring_salary_currency: fullUserData.hiring_salary_currency,
        culture_preferences: fullUserData.culture_preferences,
        remote_policy_importance: fullUserData.remote_policy_importance,
        quiet_office_importance: fullUserData.quiet_office_importance,
        ideal_next_job_description: fullUserData.ideal_next_job_description,
        resume_file_path: fullUserData.resume_file_path
      }
    };
     if (userResponse.profile.bio === null && userResponse.profile.location === null) { // Basic check
      userResponse.profile = null;
    }

    res.json({
      message: 'Logged in successfully!',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// POST /api/auth/mark-email-as-verified - Mark user's email as verified
// Protected route: Requires authentication
router.post('/mark-email-as-verified', authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const updateQuery = `
      UPDATE users
      SET is_email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, is_email_verified;
    `;
    const { rows } = await db.query(updateQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found to mark email as verified.' });
    }

    res.status(200).json({
      message: 'User email marked as verified successfully.',
      user: rows[0]
    });
  } catch (error) {
    console.error('Error marking user email as verified:', error);
    const err = new Error('Server error while marking user email as verified.');
    next(err);
  }
});

module.exports = router;