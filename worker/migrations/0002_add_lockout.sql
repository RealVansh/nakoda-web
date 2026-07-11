-- Migration number: 0002 	 2026-07-11T07:44:19.467Z
ALTER TABLE admin_users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN locked_until TEXT;
