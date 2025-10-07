-- Sample users for fraud detection system
INSERT INTO users (username, password, email, role, enabled) VALUES
('admin', 'admin123', 'admin@fraudguard.com', 'ADMIN', true),
('analyst', 'analyst123', 'analyst@fraudguard.com', 'ANALYST', true),
('investigator', 'investigator123', 'investigator@fraudguard.com', 'INVESTIGATOR', true);

-- Sample transactions with different risk levels
INSERT INTO transactions (transaction_id, amount, type, description, timestamp, risk_level, status) VALUES
-- Normal transactions (LOW risk)
('TXN-001', 25.99, 'PURCHASE', 'Coffee Shop', CURRENT_TIMESTAMP, 'LOW', 'APPROVED'),
('TXN-002', 89.50, 'PURCHASE', 'Book Store', CURRENT_TIMESTAMP, 'LOW', 'APPROVED'),
('TXN-003', 150.00, 'PURCHASE', 'Grocery Store', CURRENT_TIMESTAMP, 'LOW', 'APPROVED'),
('TXN-004', 45.00, 'PURCHASE', 'Gas Station', CURRENT_TIMESTAMP, 'LOW', 'APPROVED'),

-- Medium risk transactions
('TXN-005', 500.00, 'ONLINE_PURCHASE', 'Electronics Store', CURRENT_TIMESTAMP, 'MEDIUM', 'PENDING'),
('TXN-006', 200.00, 'ATM', 'Cash Withdrawal', CURRENT_TIMESTAMP, 'MEDIUM', 'PENDING'),
('TXN-007', 300.00, 'TRANSFER', 'Bank Transfer', CURRENT_TIMESTAMP, 'MEDIUM', 'PENDING'),

-- High risk transactions
('TXN-008', 1500.00, 'INTERNATIONAL_TRANSFER', 'Overseas Transfer', CURRENT_TIMESTAMP, 'HIGH', 'FLAGGED'),
('TXN-009', 2500.00, 'WIRE_TRANSFER', 'Wire Transfer', CURRENT_TIMESTAMP, 'HIGH', 'FLAGGED'),
('TXN-010', 800.00, 'CRYPTO_PURCHASE', 'Cryptocurrency Exchange', CURRENT_TIMESTAMP, 'HIGH', 'FLAGGED'),

-- Critical risk transactions
('TXN-011', 10000.00, 'INTERNATIONAL_WIRE', 'Large International Wire', CURRENT_TIMESTAMP, 'CRITICAL', 'BLOCKED'),
('TXN-012', 5000.00, 'SUSPICIOUS_TRANSFER', 'Unusual Transfer Pattern', CURRENT_TIMESTAMP, 'CRITICAL', 'BLOCKED');