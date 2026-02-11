// js/email-browser.js - Browser-compatible email notifications
// No Node.js dependencies - uses fetch API to communicate with backend

class BrowserEmailNotifier {
    constructor() {
        // Configuration for browser environment - connects to real backend
        this.config = {
            API_BASE_URL: window.BACKEND_API_URL || 'https://starlink-wifi-backend.onrender.com/api',
            SENDER_EMAIL: 'notifications@starlinkwifi.com',
            ADMIN_EMAIL: window.ADMIN_EMAIL || 'starlinktokenwifi@gmail.com'
        };
        
        console.log('Browser Email Notifier initialized with admin email:', this.config.ADMIN_EMAIL);
    }
    
    // Send notification through real backend API
    async sendNotification(recipientEmail, subject, message, template = 'default') {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}/send-notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject: subject,
                    content: message,
                    template: template
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Email notification sent:', result);
            
            return result;
            
        } catch (error) {
            console.error('Error sending email notification:', error);
            return { 
                success: false, 
                message: 'Failed to send email notification: ' + error.message 
            };
        }
    }
    
    // Send admin notification
    async sendAdminNotification(message, type = 'info') {
        const subject = `Starlink WiFi Admin Notification - ${type.toUpperCase()}`;
        return await this.sendNotification(this.config.ADMIN_EMAIL, subject, message, 'admin');
    }
    
    // Send new message notification to admin via dedicated endpoint
    async sendNewMessageNotification(messageData) {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}/notify-new-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageData: messageData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('New message notification sent:', result);
            
            return result;
            
        } catch (error) {
            console.error('Error sending new message notification:', error);
            return { 
                success: false, 
                message: 'Failed to send new message notification: ' + error.message 
            };
        }
    }
    
    // Send image upload notification via dedicated endpoint
    async sendImageUploadNotification(imageData) {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}/notify-image-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData: imageData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Image upload notification sent:', result);
            
            return result;
            
        } catch (error) {
            console.error('Error sending image upload notification:', error);
            return { 
                success: false, 
                message: 'Failed to send image upload notification: ' + error.message 
            };
        }
    }
    
    // Send bundle update notification via dedicated endpoint
    async sendBundleUpdateNotification(bundleData, bundleId) {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}/notify-bundle-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bundleData: bundleData,
                    bundleId: bundleId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Bundle update notification sent:', result);
            
            return result;
            
        } catch (error) {
            console.error('Error sending bundle update notification:', error);
            return { 
                success: false, 
                message: 'Failed to send bundle update notification: ' + error.message 
            };
        }
    }
    
    // Generate email template
    generateEmailTemplate(content, templateType = 'default') {
        const templates = {
            default: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Starlink Token WiFi</h1>
                        </div>
                        <div class="content">
                            ${content}
                        </div>
                        <div class="footer">
                            <p>This is an automated notification from Starlink Token WiFi</p>
                            <p>© 2024 Starlink Token WiFi. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            
            admin: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #fef2f2; border-left: 4px solid #dc2626; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .highlight { background: #fee2e2; padding: 10px; border-radius: 5px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>ADMIN NOTIFICATION</h1>
                            <p>Starlink Token WiFi - Admin Panel</p>
                        </div>
                        <div class="content">
                            ${content}
                            <div class="highlight">
                                <p><strong>Action Required:</strong> Please log in to the admin panel to review this notification.</p>
                                <p><a href="/admin.html" 
                                      style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                    Go to Admin Panel
                                </a></p>
                            </div>
                        </div>
                        <div class="footer">
                            <p>This is an automated administrative notification</p>
                            <p>© 2024 Starlink Token WiFi. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        return templates[templateType] || templates.default;
    }
    
    // Health check endpoint
    async healthCheck() {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}/health`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Backend health check failed:', error);
            return { success: false, message: 'Backend unavailable' };
        }
    }
}

// Create singleton instance
const emailNotifier = new BrowserEmailNotifier();

// Export for use in other modules

export { emailNotifier, BrowserEmailNotifier };
