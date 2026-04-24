INSERT INTO users (username, password, email, role, enabled, two_factor_enabled, prompt_change_password) VALUES
('admin', '{noop}admin123', 'admin@fraudguard.com', 'ADMIN', true, false, false),
('analyst', '{noop}analyst123', 'analyst@fraudguard.com', 'ANALYST', true, false, false);