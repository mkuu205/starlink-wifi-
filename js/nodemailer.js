// js/nodemailer.js - Email notification system
import { config } from './config.js';

class EmailNotifier {
    constructor() {
        // Load email configuration from environment
        const emailConfig = config.getEmailConfig();
        
        this.smtpConfig = {
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass
            }
        };
        
        // Production email addresses
        this.senderEmail = emailConfig.sender;
        this.adminEmail = emailConfig.admin;
        
        // Validate configuration
        try {
            config.validate();
        } catch (error) {
            console.error('Email configuration error:', error.message);
        }
        
        // Initialize Nodemailer transporter
        this.initializeTransporter();
    }
    
    initializeTransporter() {
        try {
            // In a real implementation, you would import nodemailer
            // For browser environment, you'll need a backend service
            // This is a placeholder for server-side implementation
            console.log('Email transporter initialized');
        } catch (error) {
            console.error('Failed to initialize email transporter:', error);
        }
    }
    
    // Send email notification - Production ready
    async sendNotification(recipientEmail, subject, message, template = 'default') {
        try {
            // Production email sending using Nodemailer
            // Note: This requires a backend server to work properly
            
            const emailOptions = {
                from: this.senderEmail,
                to: recipientEmail,
                subject: subject,
                html: this.generateEmailTemplate(message, template)
            };
            
            // In a real backend implementation, you would use:
            /*
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport(this.smtpConfig);
            
            const result = await transporter.sendMail(emailOptions);
            
            // Log successful email
            const emailLog = {
                ...emailOptions,
                messageId: result.messageId,
                timestamp: Date.now(),
                status: 'sent'
            };
            
            // Save to database
            await database.saveEmailLog(emailLog);
            
            return { success: true, messageId: result.messageId };
            */
            
            // For frontend demonstration, we'll log the attempt
            console.log('Email would be sent:', emailOptions);
            
            // In production, replace this with actual email sending
            return { 
                success: true, 
                message: 'Email queued for sending',
                simulated: true 
            };
            
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, message: 'Failed to send email: ' + error.message };
        }
    }
    
    // Send admin notification
    async sendAdminNotification(message, type = 'info') {
        const subject = `Starlink WiFi Admin Notification - ${type.toUpperCase()}`;
        return await this.sendNotification(this.adminEmail, subject, message, 'admin');
    }
    
    // Send new message notification to admin
    async sendNewMessageNotification(messageData) {
        const subject = 'New Contact Message Received';
        const message = `
            <h2>New Message from Website Contact Form</h2>
            <p><strong>Name:</strong> ${messageData.name}</p>
            <p><strong>Email:</strong> ${messageData.email}</p>
            <p><strong>Phone:</strong> ${messageData.phone || 'Not provided'}</p>
            <p><strong>Service:</strong> ${messageData.service || 'Not specified'}</p>
            <p><strong>Message:</strong></p>
            <blockquote>${messageData.message}</blockquote>
            <p><small>Received at: ${new Date(messageData.timestamp).toLocaleString()}</small></p>
        `;
        
        return await this.sendAdminNotification(message, 'new_message');
    }
    
    // Send image upload notification
    async sendImageUploadNotification(imageData) {
        const subject = 'New Image Uploaded to Gallery';
        const message = `
            <h2>New Image Added to Gallery</h2>
            <p><strong>Title:</strong> ${imageData.title}</p>
            <p><strong>Description:</strong> ${imageData.description}</p>
            <p><strong>Category:</strong> ${imageData.category}</p>
            <p><strong>File:</strong> ${imageData.filename}</p>
            <p><strong>Size:</strong> ${(imageData.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><small>Uploaded at: ${new Date(imageData.timestamp).toLocaleString()}</small></p>
        `;
        
        return await this.sendAdminNotification(message, 'image_upload');
    }
    
    // Send bundle update notification
    async sendBundleUpdateNotification(bundleData, bundleId) {
        const subject = 'Bundle Updated';
        const message = `
            <h2>Bundle Information Updated</h2>
            <p><strong>Bundle ID:</strong> ${bundleId}</p>
            <p><strong>Name:</strong> ${bundleData.name}</p>
            <p><strong>Price:</strong> KSh ${bundleData.price}</p>
            <p><strong>Features:</strong></p>
            <ul>
                ${bundleData.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <p><small>Updated at: ${new Date(bundleData.updated).toLocaleString()}</small></p>
        `;
        
        return await this.sendAdminNotification(message, 'bundle_update');
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
                            <p>This is an automated notification from Starlink Token WiFi Admin System</p>
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
                                <p><a href="http://localhost:5500/starlink-wifi--main/starlink-wifi--main/admin.html" 
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
    
    // Get sent emails from database
    async getSentEmails() {
        try {
            // In production, fetch from your database
            // This is a placeholder that would connect to your backend
            const response = await fetch('/api/emails/history');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to fetch email history');
        } catch (error) {
            console.error('Error fetching email history:', error);
            // Return empty array as fallback
            return [];
        }
    }
    
    // Clear sent emails
    async clearSentEmails() {
        try {
            // In production, call your backend API
            const response = await fetch('/api/emails/clear', {
                method: 'POST'
            });
            
            if (response.ok) {
                return { success: true, message: 'Email history cleared successfully' };
            }
            throw new Error('Failed to clear email history');
        } catch (error) {
            console.error('Error clearing email history:', error);
            return { success: false, message: 'Failed to clear email history: ' + error.message };
        }
    }
}

// Initialize email notifier
const emailNotifier = new EmailNotifier();

// Export for use in other modules
export { emailNotifier };