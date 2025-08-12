-- Insert system configuration
INSERT INTO system_config (id, key, value, description) VALUES
('config_1', 'commission_rate', '15', 'Default commission rate percentage'),
('config_2', 'min_cashout_amount', '1000', 'Minimum amount for driver cashout'),
('config_3', 'token_reward_rate', '5', 'Tokens awarded for good ratings');

-- Insert sample routes
INSERT INTO routes (id, start_location, end_location, type, base_price, distance, estimated_time) VALUES
('route_1', 'Lagos Island', 'Victoria Island', 'KEKE', 500.00, 5.2, 25),
('route_2', 'Lagos Island', 'Victoria Island', 'CAR', 1500.00, 5.2, 20),
('route_3', 'Ikeja', 'Maryland', 'KEKE', 300.00, 3.8, 15),
('route_4', 'Ikeja', 'Maryland', 'CAR', 1000.00, 3.8, 12),
('route_5', 'Surulere', 'Yaba', 'KEKE', 400.00, 4.1, 18),
('route_6', 'Surulere', 'Yaba', 'BUS', 2000.00, 4.1, 15),
('route_7', 'Lekki', 'Ajah', 'KEKE', 600.00, 8.5, 35),
('route_8', 'Lekki', 'Ajah', 'CAR', 2500.00, 8.5, 30);

-- Insert admin user (password: admin123)
INSERT INTO admin_users (id, email, password_hash, role, permissions) VALUES
('admin_1', 'admin@rideapp.com', '$2b$10$rQZ8kHWfQYwjKxVQxGQxHOqGQxvQxGQxHOqGQxvQxGQxHOqGQxvQx', 'ADMIN', '["manage_users", "manage_rides", "manage_routes", "manage_maintenance", "view_analytics"]');
