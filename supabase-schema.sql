-- Starlink WiFi - Complete Supabase Database Schema
-- Run this SQL in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    filename VARCHAR(255),
    category VARCHAR(50) DEFAULT 'general',
    size INTEGER,
    type VARCHAR(50),
    visible BOOLEAN DEFAULT true,
    uploaded_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    service VARCHAR(100),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'received',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bundle_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features TEXT[], -- Array of features
    description TEXT,
    visible BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100) DEFAULT 'admin'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message TEXT NOT NULL,
    title VARCHAR(255),
    type VARCHAR(50) DEFAULT 'site_update',
    priority VARCHAR(20) DEFAULT 'normal',
    sent BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admins table for authentication
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In production, use proper password hashing
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default bundles
INSERT INTO bundles (bundle_id, name, price, features, description, visible, featured) VALUES
('daily', 'Daily Bundle', 50.00, 
    ARRAY['500MB Data', '24 Hours Validity', 'High Speed', 'No Expiry'],
    'Perfect for light internet users who need connectivity for a day',
    true, false
) ON CONFLICT (bundle_id) DO NOTHING;

INSERT INTO bundles (bundle_id, name, price, features, description, visible, featured) VALUES
('weekly', 'Weekly Bundle', 200.00, 
    ARRAY['3GB Data', '7 Days Validity', 'High Speed', 'No Expiry'],
    'Great value for regular users who need consistent connectivity',
    true, false
) ON CONFLICT (bundle_id) DO NOTHING;

INSERT INTO bundles (bundle_id, name, price, features, description, visible, featured) VALUES
('monthly', 'Monthly Bundle', 500.00, 
    ARRAY['15GB Data', '30 Days Validity', 'High Speed', 'No Expiry'],
    'Best value for heavy users with unlimited browsing',
    true, false
) ON CONFLICT (bundle_id) DO NOTHING;

INSERT INTO bundles (bundle_id, name, price, features, description, visible, featured) VALUES
('business', 'Business Bundle', 1500.00, 
    ARRAY['50GB Data', '30 Days Validity', 'Priority Support', 'Static IP', '24/7 Support'],
    'Professional solution for businesses with dedicated support',
    true, true
) ON CONFLICT (bundle_id) DO NOTHING;

-- Insert default admin user (change password in production)
INSERT INTO admins (email, password, name, role, is_active) VALUES
('starlinktokenwifi@gmail.com', 'admin123', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_visible ON gallery(visible);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_email ON messages(email);

CREATE INDEX IF NOT EXISTS idx_bundles_visible ON bundles(visible);
CREATE INDEX IF NOT EXISTS idx_bundles_featured ON bundles(featured);
CREATE INDEX IF NOT EXISTS idx_bundles_price ON bundles(price);

CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gallery_updated_at 
    BEFORE UPDATE ON gallery 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at 
    BEFORE UPDATE ON bundles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access where appropriate
CREATE POLICY "Public can view visible gallery items" 
    ON gallery FOR SELECT 
    USING (visible = true);

CREATE POLICY "Public can view visible bundles" 
    ON bundles FOR SELECT 
    USING (visible = true);

-- Create policies for admin access
CREATE POLICY "Admins can manage gallery" 
    ON gallery FOR ALL 
    USING (true);

CREATE POLICY "Admins can manage messages" 
    ON messages FOR ALL 
    USING (true);

CREATE POLICY "Admins can manage bundles" 
    ON bundles FOR ALL 
    USING (true);

CREATE POLICY "Admins can manage notifications" 
    ON notifications FOR ALL 
    USING (true);

CREATE POLICY "Admins can manage admins" 
    ON admins FOR ALL 
    USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM messages 
        WHERE read = false
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get recent gallery items count
CREATE OR REPLACE FUNCTION get_gallery_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM gallery 
        WHERE visible = true
    );
END;
$$ LANGUAGE plpgsql;

-- Insert some sample gallery data (optional)
-- Uncomment and modify as needed
/*
INSERT INTO gallery (title, description, image_url, category, filename) VALUES
('Office WiFi Installation', 'Professional installation in corporate environment', 
 'https://example.com/office-installation.jpg', 'business', 'office-installation.jpg'),
('Home Network Setup', 'Complete home WiFi solution with mesh networking', 
 'https://example.com/home-setup.jpg', 'home', 'home-setup.jpg'),
('Commercial Installation', 'Large scale WiFi deployment for retail space', 
 'https://example.com/commercial.jpg', 'business', 'commercial.jpg');
*/

-- Verify the schema creation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('gallery', 'messages', 'bundles', 'notifications', 'admins')
ORDER BY table_name, ordinal_position;