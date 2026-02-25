// js/supabase-config.js - Supabase database configuration
import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ'; // Replace with your Supabase anon key

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Database operations class
class DatabaseManager {
    constructor() {
        this.client = supabase;
    }

    // Gallery operations
    async getGalleryImages(category = null, limit = 50) {
        try {
            let query = this.client
                .from('gallery')
                .select('*')
                .eq('visible', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching gallery:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadImage(imageData) {
        try {
            const { data, error } = await this.client
                .from('gallery')
                .insert([{
                    title: imageData.title || '',
                    description: imageData.description || '',
                    url: imageData.url,
                    filename: imageData.filename,
                    category: imageData.category || 'general',
                    size: imageData.size,
                    type: imageData.type,
                    visible: true,
                    uploaded_by: 'admin'
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteImage(imageId) {
        try {
            const { error } = await this.client
                .from('gallery')
                .delete()
                .eq('id', imageId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: error.message };
        }
    }

    // Message operations
    async getMessages(read = null, limit = 100) {
        try {
            let query = this.client
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (read !== null) {
                query = query.eq('read', read);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching messages:', error);
            return { success: false, error: error.message };
        }
    }

    async createMessage(messageData) {
        try {
            const { data, error } = await this.client
                .from('messages')
                .insert([{
                    name: messageData.name,
                    email: messageData.email,
                    phone: messageData.phone || '',
                    service: messageData.service || '',
                    message: messageData.message,
                    read: false,
                    status: 'received',
                    ip_address: messageData.ipAddress,
                    user_agent: messageData.userAgent
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating message:', error);
            return { success: false, error: error.message };
        }
    }

    async updateMessage(messageId, updates) {
        try {
            const updateData = {};
            
            if (updates.read !== undefined) {
                updateData.read = updates.read;
                updateData.read_at = updates.read ? new Date().toISOString() : null;
            }
            
            if (updates.status) {
                updateData.status = updates.status;
                if (updates.status === 'responded') {
                    updateData.responded_at = new Date().toISOString();
                }
            }

            const { data, error } = await this.client
                .from('messages')
                .update(updateData)
                .eq('id', messageId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating message:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteMessage(messageId) {
        try {
            const { error } = await this.client
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting message:', error);
            return { success: false, error: error.message };
        }
    }

    // Bundle operations
    async getBundles() {
        try {
            const { data, error } = await this.client
                .from('bundles')
                .select('*')
                .eq('visible', true)
                .order('price', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching bundles:', error);
            return { success: false, error: error.message };
        }
    }

    async updateBundle(bundleId, bundleData) {
        try {
            const { data, error } = await this.client
                .from('bundles')
                .update({
                    ...bundleData,
                    last_updated: new Date().toISOString(),
                    updated_by: 'admin'
                })
                .eq('bundle_id', bundleId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating bundle:', error);
            return { success: false, error: error.message };
        }
    }

    // Admin operations
    async authenticateAdmin(email, password) {
        try {
            // In production, you'd use Supabase Auth
            // This is a simplified version for demo
            const { data, error } = await this.client
                .from('admins')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            
            // Simple password check (in production, use proper auth)
            if (data.password === password) {
                return { 
                    success: true, 
                    user: { 
                        id: data.id, 
                        email: data.email, 
                        name: data.name 
                    } 
                };
            }
            
            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('Error authenticating admin:', error);
            return { success: false, error: error.message };
        }
    }

    async getUnreadMessageCount() {
        try {
            const { count, error } = await this.client
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('read', false);

            if (error) throw error;
            return { success: true, count };
        } catch (error) {
            console.error('Error getting unread count:', error);
            return { success: false, error: error.message, count: 0 };
        }
    }
}

// Create singleton instance
const database = new DatabaseManager();

// Admin authentication helper
class AdminAuth {
    constructor() {
        this.authenticated = !!localStorage.getItem('adminAuthenticated');
        this.user = JSON.parse(localStorage.getItem('adminUser') || 'null');
    }

    isAuthenticated() {
        return this.authenticated;
    }

    getUser() {
        return this.user;
    }

    async login(email, password) {
        try {
            const result = await database.authenticateAdmin(email, password);
            
            if (result.success) {
                this.authenticated = true;
                this.user = result.user;
                localStorage.setItem('adminAuthenticated', 'true');
                localStorage.setItem('adminUser', JSON.stringify(result.user));
                return { success: true };
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.authenticated = false;
        this.user = null;
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminUser');
    }
}

const adminAuth = new AdminAuth();

// Export for use in other modules

export { database, adminAuth, supabase };
