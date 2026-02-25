// js/supabase-config.js - Supabase database configuration
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration from environment variables
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    // Admin operations - Updated to use Supabase Auth
    async authenticateAdmin(email, password) {
        try {
            // Use Supabase Auth for authentication
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Get admin profile from admins table
            const { data: adminData, error: profileError } = await this.client
                .from('admins')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (profileError) {
                // Admin authenticated but not found in admins table
                return { 
                    success: false, 
                    error: 'Admin account not found or inactive' 
                };
            }

            return { 
                success: true, 
                user: { 
                    id: adminData.id, 
                    email: adminData.email, 
                    name: adminData.name,
                    role: adminData.role || 'admin'
                },
                session: data.session
            };
        } catch (error) {
            console.error('Error authenticating admin:', error);
            
            // Handle specific auth errors
            if (error.message === 'Invalid login credentials') {
                return { success: false, error: 'Invalid email or password' };
            }
            
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

    async getCurrentAdmin() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error) throw error;
            if (!user) return { success: false, error: 'Not authenticated' };

            // Get admin profile
            const { data: adminData, error: profileError } = await this.client
                .from('admins')
                .select('*')
                .eq('email', user.email)
                .single();

            if (profileError) throw profileError;

            return { 
                success: true, 
                user: {
                    id: adminData.id,
                    email: adminData.email,
                    name: adminData.name,
                    role: adminData.role
                }
            };
        } catch (error) {
            console.error('Error getting current admin:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error signing out:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const database = new DatabaseManager();

// Admin authentication helper - Updated to use Supabase Auth
class AdminAuth {
    constructor() {
        this.authenticated = false;
        this.user = null;
        this.initAuth();
    }

    async initAuth() {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const result = await database.getCurrentAdmin();
            if (result.success) {
                this.authenticated = true;
                this.user = result.user;
                this._saveToStorage();
            }
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this._refreshUser();
            } else if (event === 'SIGNED_OUT') {
                this.authenticated = false;
                this.user = null;
                this._clearStorage();
            }
        });
    }

    async _refreshUser() {
        const result = await database.getCurrentAdmin();
        if (result.success) {
            this.authenticated = true;
            this.user = result.user;
            this._saveToStorage();
        }
    }

    _saveToStorage() {
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminUser', JSON.stringify(this.user));
    }

    _clearStorage() {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminUser');
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
                this._saveToStorage();
                return { success: true, user: result.user };
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        const result = await database.signOut();
        this.authenticated = false;
        this.user = null;
        this._clearStorage();
        return result;
    }

    async checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && this.authenticated) {
            // Session expired but local state says authenticated
            this.authenticated = false;
            this.user = null;
            this._clearStorage();
        }
        return this.authenticated;
    }
}

const adminAuth = new AdminAuth();

// Export for use in other modules
export { database, adminAuth, supabase };
