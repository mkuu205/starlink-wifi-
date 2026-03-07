// email-browser.js - Email Notification System
// Email: support@starlinktokenwifi.com (forwards to billnjehia18@gmail.com)

class BrowserEmailNotifier {
  constructor() {
    // Use correct backend URL
    const backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'https://starlink-wifi-backend-v862.onrender.com';
    
    this.config = {
      API_BASE_URL: window.BACKEND_API_URL || `${backendUrl}/api`,
      SENDER_EMAIL: 'support@starlinktokenwifi.com',
      ADMIN_EMAIL: 'billnjehia18@gmail.com'
    };
    
    console.log('✅ Email Notifier initialized');
    console.log('📧 Sender:', this.config.SENDER_EMAIL);
    console.log('📧 Admin:', this.config.ADMIN_EMAIL);
  }
  
  async sendNotification(recipientEmail, subject, message, template = 'default') {
    try {
      console.log('📨 Sending email to:', recipientEmail);
      
      const response = await fetch(`${this.config.API_BASE_URL}/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject,
          content: message,
          template: template,
          from: this.config.SENDER_EMAIL
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Email sent:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, message: error.message };
    }
  }
  
  async sendAdminNotification(message, type = 'info') {
    const subject = `Starlink WiFi Admin Notification - ${type.toUpperCase()}`;
    return await this.sendNotification(this.config.ADMIN_EMAIL, subject, message, 'admin');
  }
  
  async sendNewMessageNotification(messageData) {
    try {
      const response = await fetch(`${this.config.API_BASE_URL}/notify-new-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageData: messageData,
          adminEmail: this.config.ADMIN_EMAIL
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, message: error.message };
    }
  }
  
  async sendImageUploadNotification(imageData) {
    try {
      const response = await fetch(`${this.config.API_BASE_URL}/notify-image-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageData,
          adminEmail: this.config.ADMIN_EMAIL
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, message: error.message };
    }
  }
  
  async sendBundleUpdateNotification(bundleData, bundleId) {
    try {
      const response = await fetch(`${this.config.API_BASE_URL}/notify-bundle-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleData: bundleData,
          bundleId: bundleId,
          adminEmail: this.config.ADMIN_EMAIL
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, message: error.message };
    }
  }
  
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.API_BASE_URL}/health`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return { success: true, data: await response.json() };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Create instance
const emailNotifier = new BrowserEmailNotifier();

// Health check on load
emailNotifier.healthCheck().then(result => {
  if (result.success) {
    console.log('🚀 Email system ready');
  } else {
    console.warn('⚠️ Email system initialized but backend unreachable');
  }
});

// Export to global scope
window.emailNotifier = emailNotifier;
window.BrowserEmailNotifier = BrowserEmailNotifier;

