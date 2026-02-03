-- Sample users for fraud detection system
INSERT INTO users (username, password, email, role, enabled) VALUES
('admin', 'admin123', 'admin@fraudguard.com', 'ADMIN', true),
('analyst', 'analyst123', 'analyst@fraudguard.com', 'ANALYST', true);

-- Sample transactions matching new Transaction model
-- LOW risk transactions (riskScore < 0.3)
INSERT INTO transactions (id, cc_num, amount, category, latitude, longitude, timestamp, risk_score, status) VALUES
(RANDOM_UUID(), '4532015112830366', 45.50, 'grocery_pos', 40.7128, -74.0060, CURRENT_TIMESTAMP, 0.15, 'APPROVED'),
(RANDOM_UUID(), '4532015112830366', 120.00, 'gas_transport', 40.7580, -73.9855, CURRENT_TIMESTAMP, 0.12, 'APPROVED'),
(RANDOM_UUID(), '5425233430109903', 89.99, 'shopping_pos', 34.0522, -118.2437, CURRENT_TIMESTAMP, 0.18, 'APPROVED');

-- MEDIUM risk transactions (0.3 <= riskScore < 0.6)
INSERT INTO transactions (id, cc_num, amount, category, latitude, longitude, timestamp, risk_score, status) VALUES
(RANDOM_UUID(), '4532015112830366', 450.00, 'shopping_net', 40.7128, -74.0060, CURRENT_TIMESTAMP, 0.42, 'REVIEW'),
(RANDOM_UUID(), '5425233430109903', 750.00, 'misc_net', 34.0522, -118.2437, CURRENT_TIMESTAMP, 0.55, 'REVIEW');

-- HIGH risk transactions (0.6 <= riskScore < 0.8)
INSERT INTO transactions (id, cc_num, amount, category, latitude, longitude, timestamp, risk_score, status) VALUES
(RANDOM_UUID(), '4532015112830366', 1899.00, 'shopping_net', 51.5074, -0.1278, CURRENT_TIMESTAMP, 0.68, 'FLAGGED'),
(RANDOM_UUID(), '5425233430109903', 2500.00, 'travel', 48.8566, 2.3522, CURRENT_TIMESTAMP, 0.72, 'FLAGGED');

-- CRITICAL risk transactions (riskScore >= 0.8)
INSERT INTO transactions (id, cc_num, amount, category, latitude, longitude, timestamp, risk_score, status) VALUES
(RANDOM_UUID(), '4532015112830366', 5000.00, 'misc_net', 35.6762, 139.6503, CURRENT_TIMESTAMP, 0.89, 'BLOCKED'),
(RANDOM_UUID(), '5425233430109903', 8500.00, 'shopping_net', -33.8688, 151.2093, CURRENT_TIMESTAMP, 0.95, 'BLOCKED');