USE admin_trees;

-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN profile_picture varchar(255) DEFAULT NULL,
ADD COLUMN bio text DEFAULT NULL,
ADD COLUMN location varchar(255) DEFAULT NULL,
ADD COLUMN joined_date datetime NOT NULL DEFAULT current_timestamp(),
ADD COLUMN last_login datetime DEFAULT NULL,
ADD COLUMN contributions_count int(11) DEFAULT 0,
ADD COLUMN social_media json DEFAULT NULL,
ADD COLUMN preferences json DEFAULT NULL,
ADD COLUMN reset_token varchar(255) DEFAULT NULL,
ADD COLUMN reset_token_expiry datetime DEFAULT NULL;

-- Update existing users to have a joined_date
UPDATE users SET joined_date = created_at WHERE joined_date IS NULL; 