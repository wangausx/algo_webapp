-- Database initialization script for Algo Trading WebApp
-- This script creates the necessary tables and indexes

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    api_key VARCHAR(255),
    secret_key VARCHAR(255),
    brokerage_type VARCHAR(20) DEFAULT 'paper',
    model_type VARCHAR(50) DEFAULT 'intraday_reversal',
    risk_level VARCHAR(20) DEFAULT 'moderate',
    balance DECIMAL(15,2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    quantity INTEGER NOT NULL,
    entry_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    unrealized_pl DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create closed_positions table
CREATE TABLE IF NOT EXISTS closed_positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    quantity INTEGER NOT NULL,
    entry_price DECIMAL(10,2) NOT NULL,
    exit_price DECIMAL(10,2) NOT NULL,
    realized_pl DECIMAL(15,2) NOT NULL,
    closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity INTEGER NOT NULL,
    filled_quantity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partially_filled', 'canceled', 'rejected')),
    filled_avg_price DECIMAL(10,2),
    client_order_id VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMP
);

-- Create trade_settings table
CREATE TABLE IF NOT EXISTS trade_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    trading_status VARCHAR(20) DEFAULT 'stopped' CHECK (trading_status IN ('running', 'stopped')),
    subscribed_symbols JSONB DEFAULT '[]',
    risk_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_closed_positions_user_id ON closed_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_closed_positions_closed_at ON closed_positions(closed_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_submitted_at ON orders(submitted_at);
CREATE INDEX IF NOT EXISTS idx_trade_settings_user_id ON trade_settings(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_settings_updated_at BEFORE UPDATE ON trade_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default user if not exists
INSERT INTO users (username, api_key, secret_key, brokerage_type, model_type, risk_level, balance)
VALUES ('wangausx', '', '', 'paper', 'intraday_reversal', 'moderate', 10000.00)
ON CONFLICT (username) DO NOTHING;

-- Insert default trade settings
INSERT INTO trade_settings (user_id, trading_status, subscribed_symbols, risk_settings)
SELECT id, 'stopped', '[]', '{"max_leverage": 3, "riskPercentage": 1, "maxDailyLoss": 1500}'
FROM users WHERE username = 'wangausx'
ON CONFLICT (user_id) DO NOTHING; 