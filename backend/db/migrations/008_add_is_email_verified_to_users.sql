-- Migration to add email verification flag to the users table

ALTER TABLE users
ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN users.is_email_verified IS 'Indicates if the user''s email address has been verified.';

-- Optionally, update the GET /api/users/me endpoint to return this field.
-- This will be handled in the userRoutes.js file if not already present.
