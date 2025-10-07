-- Sample users for fraud detection system
INSERT INTO users (username, password, email, role, enabled) VALUES
('admin', 'admin123', 'admin@fraudguard.com', 'ADMIN', true),
('analyst', 'analyst123', 'analyst@fraudguard.com', 'ANALYST', true);

-- Sample transactions matching frontend expectations
-- LOW risk transactions
INSERT INTO transactions (transaction_id, amount, type, description, timestamp, risk_level, status, fraud_score) VALUES
('TXN-2024-001', 120.00, 'Card Present', 'Store Purchase', CURRENT_TIMESTAMP, 'LOW', 'APPROVED', 15),
('TXN-2024-002', 45.50, 'Online Purchase', 'E-commerce', CURRENT_TIMESTAMP, 'LOW', 'APPROVED', 12),
('TXN-2024-003', 300.00, 'ATM Withdrawal', 'Cash Withdrawal', CURRENT_TIMESTAMP, 'LOW', 'APPROVED', 18);

-- MEDIUM risk transactions
INSERT INTO transactions (transaction_id, amount, type, description, timestamp, risk_level, status, fraud_score) VALUES
('TXN-2024-004', 890.50, 'CNP Transaction', 'Card Not Present', CURRENT_TIMESTAMP, 'MEDIUM', 'PENDING', 55),
('TXN-2024-005', 750.00, 'Mobile Payment', 'Digital Wallet', CURRENT_TIMESTAMP, 'MEDIUM', 'PENDING', 48);

-- HIGH risk transactions
INSERT INTO transactions (transaction_id, amount, type, description, timestamp, risk_level, status, fraud_score) VALUES
('TXN-2024-006', 4567.89, 'Online Purchase', 'Large Transaction', CURRENT_TIMESTAMP, 'HIGH', 'FLAGGED', 95),
('TXN-2024-007', 1899.00, 'Online Purchase', 'Suspicious Pattern', CURRENT_TIMESTAMP, 'HIGH', 'FLAGGED', 88),
('TXN-2024-008', 3200.00, 'Wire Transfer', 'International Transfer', CURRENT_TIMESTAMP, 'HIGH', 'FLAGGED', 92);

-- CRITICAL risk transactions
INSERT INTO transactions (transaction_id, amount, type, description, timestamp, risk_level, status, fraud_score) VALUES
('TXN-2024-009', 10000.00, 'Wire Transfer', 'High Value Transfer', CURRENT_TIMESTAMP, 'CRITICAL', 'BLOCKED', 98),
('TXN-2024-010', 8500.00, 'Crypto Purchase', 'Cryptocurrency', CURRENT_TIMESTAMP, 'CRITICAL', 'BLOCKED', 97);