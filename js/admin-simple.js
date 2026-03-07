// admin-simple.js - Complete Admin Panel with Push Notifications
// Email notifications go to: billnjehia18@gmail.com

console.log('✅ Admin panel loading...');

// Check Authentication
function isAdminAuthenticated() {
  return localStorage.getItem('adminAuthenticated') === 'true';
}

// Database Functions
const simpleDatabase = {
  getImages: function() {
    try {
      const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
      return { success: true, images: gallery };
    } catch (error) {
      return { success: false, images: [] };
    }
  },
  
  getMessages: function() {
    try {
      const messages = JSON.parse(localStorage.getItem('messages') || '[]');
      return { success: true, messages: messages.reverse() };
    } catch (error) {
      return { success: false, messages: [] };
    }
  },
  
  getBundles: function() {
    try {
      const bundles = JSON.parse(localStorage.getItem('bundles') || '{}');
      return { success: true, bundles };
    } catch (error) {
      return { success: false, bundles: {} };
    }
  }
};

// Send Push Notification via Backend - USING ONLY THIS ENDPOINT
async function sendPushNotification(title, message, priority = 'normal') {
  try {
    console.log('📨 Sending push notification:', { title, message, priority });
    
    const backendUrl = (window.location.hostname === 'localhost')
      ? 'http://localhost:3000'
      : 'https://starlink-wifi-backend-v862.onrender.com';
    
    const response = await fetch(`${backendUrl}/api/send-push-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        body: message,
        priority: priority,
        topic: 'all_users'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Push notification sent:', result);
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    // NO FALLBACK - just return error
    return { 
      success: false, 
      error: error.message
    };
  }
}

// Admin Panel Class
class SimpleAdminPanel {
  constructor() {
    this.backendUrl = (window.location.hostname === 'localhost')
      ? 'http://localhost:3000'
      : 'https://starlink-wifi-backend-v862.onrender.com';
    this.init();
  }
  
  init() {
    console.log('Initializing admin panel...');
    
    if (!isAdminAuthenticated()) {
      console.log('Not authenticated, redirecting...');
      window.location.href = 'admin-login.html';
      return;
    }
    
    this.setupTabNavigation();
    this.setupEventListeners();
    this.loadStats();
    this.loadAdminGallery();
    this.loadMessages();
    this.loadBundlesForEdit();
    this.checkServerHealth();
    
    console.log('✅ Admin panel initialized');
  }
  
  async checkServerHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/api/health`);
      const data = await response.json();
      if (data.success) {
        this.showMessage('✅ Connected to server', 'success');
      }
    } catch (error) {
      this.showMessage('⚠️ Server connection failed', 'warning');
    }
  }
  
  setupTabNavigation() {
    const tabs = document.querySelectorAll('.admin-menu a[data-tab]');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.admin-tab').forEach(content => {
          content.classList.remove('active');
        });
        const tabId = tab.getAttribute('data-tab');
        const tabElement = document.getElementById(tabId);
        if (tabElement) tabElement.classList.add('active');
      });
    });
  }
  
  setupEventListeners() {
    // Upload Image
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this.uploadImage());
    }
    
    // Clear Upload Form
    const clearBtn = document.getElementById('clear-upload-form');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearUploadForm());
    }
    
    // Update Bundle
    const updateBundleBtn = document.getElementById('update-bundle');
    if (updateBundleBtn) {
      updateBundleBtn.addEventListener('click', () => this.updateBundle());
    }
    
    // Push Update - USING THE PUSH NOTIFICATION ENDPOINT
    const pushUpdateBtn = document.getElementById('push-update');
    if (pushUpdateBtn) {
      pushUpdateBtn.addEventListener('click', () => this.pushUpdate());
    }
    
    // Clear Update Form
    const clearUpdateBtn = document.getElementById('clear-update-form');
    if (clearUpdateBtn) {
      clearUpdateBtn.addEventListener('click', () => this.clearUpdateForm());
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
    
    // Test Notification
    const testBtn = document.getElementById('test-notification');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testNotification());
    }
    
    // Clear Cache
    const clearCacheBtn = document.getElementById('clear-cache');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => this.clearCache());
    }
    
    // Export Data
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }
    
    // View Emails
    const viewEmailsBtn = document.getElementById('view-emails');
    if (viewEmailsBtn) {
      viewEmailsBtn.addEventListener('click', () => this.viewEmails());
    }
    
    // Delegated Events
    document.addEventListener('click', (e) => {
      if (e.target.closest('.mark-read')) {
        const btn = e.target.closest('.mark-read');
        this.toggleMessageRead(btn.dataset.id);
      }
      
      if (e.target.closest('.delete-message')) {
        const btn = e.target.closest('.delete-message');
        if (confirm('Delete this message?')) {
          this.deleteMessage(btn.dataset.id);
        }
      }
      
      if (e.target.closest('.delete-image')) {
        const btn = e.target.closest('.delete-image');
        if (confirm('Delete this image?')) {
          this.deleteImage(btn.dataset.id);
        }
      }
    });
  }
  
  logout() {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminEmail');
    window.location.href = 'admin-login.html';
  }
  
  async testNotification() {
    await this.pushUpdate(true);
  }
  
  clearCache() {
    if (confirm('Clear all cached data? This will not affect server data.')) {
      localStorage.removeItem('site_updates');
      this.showMessage('Cache cleared successfully');
    }
  }
  
  exportData() {
    const data = {
      gallery: simpleDatabase.getImages().images,
      messages: simpleDatabase.getMessages().messages,
      bundles: simpleDatabase.getBundles().bundles,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showMessage('Data exported successfully');
  }
  
  viewEmails() {
    const emails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
    if (emails.length === 0) {
      this.showMessage('No emails sent yet', 'info');
      return;
    }
    
    console.log('Sent emails:', emails);
    alert(`View ${emails.length} emails in console (F12)`);
  }
  
  async uploadImage() {
    const fileInput = document.getElementById('image-upload');
    const title = document.getElementById('image-title').value;
    const description = document.getElementById('image-description').value;
    const category = document.getElementById('image-category').value;
    const progressDiv = document.getElementById('upload-progress');
    
    if (!fileInput.files[0]) {
      this.showMessage('Please select an image', 'error');
      return;
    }
    
    const file = fileInput.files[0];
    
    // Validate
    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('File size must be less than 5MB', 'error');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.showMessage('Please upload a valid image file', 'error');
      return;
    }
    
    progressDiv.innerHTML = '<div class="upload-progress-bar"><div class="progress"></div></div>';
    const progressBar = progressDiv.querySelector('.progress');
    
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      progressBar.style.width = `${Math.min(progress, 90)}%`;
      if (progress >= 90) clearInterval(progressInterval);
    }, 100);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      clearInterval(progressInterval);
      progressBar.style.width = '100%';
      
      const imageData = {
        id: `img_${Date.now()}`,
        image_url: e.target.result,
        url: e.target.result,
        title: title || '',
        description: description || '',
        category: category,
        filename: file.name,
        timestamp: Date.now(),
        visible: true,
        size: file.size,
        type: file.type
      };
      
      let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
      gallery.push(imageData);
      localStorage.setItem('gallery', JSON.stringify(gallery));
      
      setTimeout(() => {
        this.showMessage('Image uploaded successfully!');
        progressDiv.innerHTML = '';
        this.clearUploadForm();
        this.loadAdminGallery();
        this.loadStats();
      }, 500);
    };
    
    reader.readAsDataURL(file);
  }
  
  clearUploadForm() {
    const ids = ['image-upload', 'image-title', 'image-description'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const cat = document.getElementById('image-category');
    if (cat) cat.value = 'general';
    const prog = document.getElementById('upload-progress');
    if (prog) prog.innerHTML = '';
  }
  
  deleteImage(imageId) {
    try {
      let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
      gallery = gallery.filter(img => img.id !== imageId);
      localStorage.setItem('gallery', JSON.stringify(gallery));
      this.showMessage('Image deleted successfully!');
      this.loadAdminGallery();
      this.loadStats();
    } catch (error) {
      console.error('Delete error:', error);
      this.showMessage('Error deleting image', 'error');
    }
  }
  
  updateBundle() {
    const bundleSelect = document.getElementById('bundle-select');
    const nameInput = document.getElementById('bundle-name');
    const priceInput = document.getElementById('bundle-price');
    const featuresInput = document.getElementById('bundle-features');
    
    if (!bundleSelect || !nameInput || !priceInput || !featuresInput) {
      this.showMessage('Bundle form elements not found', 'error');
      return;
    }
    
    const bundleType = bundleSelect.value;
    const name = nameInput.value;
    const price = priceInput.value;
    const features = featuresInput.value;
    
    if (!name || !price) {
      this.showMessage('Please fill in all required fields', 'error');
      return;
    }
    
    const bundleData = {
      id: bundleType,
      name: name,
      price: parseFloat(price),
      features: features.split('\n').filter(f => f.trim()),
      updated: Date.now(),
      visible: true
    };
    
    try {
      let bundles = JSON.parse(localStorage.getItem('bundles') || '{}');
      bundles[bundleType] = bundleData;
      localStorage.setItem('bundles', JSON.stringify(bundles));
      
      this.showMessage('Bundle updated successfully!');
      nameInput.value = '';
      priceInput.value = '';
      featuresInput.value = '';
      
    } catch (error) {
      console.error('Error updating bundle:', error);
      this.showMessage('Error updating bundle', 'error');
    }
  }
  
  // Push update with notification - USING ONLY /api/send-push-notification
  async pushUpdate(isTest = false) {
    const updateTitle = document.getElementById('update-title');
    const updateContent = document.getElementById('update-content');
    const updatePriority = document.getElementById('update-priority');
    
    if (!updateContent) return;
    
    let title = isTest ? '🔔 Test Notification' : (updateTitle ? updateTitle.value : 'Site Update');
    const content = isTest ? 'This is a test notification from the admin panel.' : updateContent.value;
    const priority = updatePriority ? updatePriority.value : 'normal';
    
    if (!isTest && !content) {
      this.showMessage('Please enter update content', 'error');
      return;
    }
    
    // Show sending indicator
    const sendBtn = document.getElementById('push-update');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendBtn.disabled = true;
    
    try {
      console.log('📤 Sending push notification to:', `${this.backendUrl}/api/send-push-notification`);
      
      // Send to backend API - USING THE SPECIFIED ENDPOINT
      const response = await fetch(`${this.backendUrl}/api/send-push-notification`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          body: content,
          priority: priority,
          topic: 'all_users'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('✅ Push notification sent:', result);
      
      // Show success message
      let message = isTest ? '✅ Test notification sent!' : '✅ Update sent successfully!';
      if (result.sent !== undefined) {
        message += ` Delivered to ${result.sent} devices.`;
      }
      
      this.showMessage(message, 'success');
      
      if (!isTest) {
        this.clearUpdateForm();
      }
      
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      this.showMessage(`❌ Failed to send: ${error.message}`, 'error');
      
    } finally {
      sendBtn.innerHTML = originalText;
      sendBtn.disabled = false;
    }
  }
  
  clearUpdateForm() {
    const title = document.getElementById('update-title');
    const content = document.getElementById('update-content');
    const priority = document.getElementById('update-priority');
    
    if (title) title.value = '';
    if (content) content.value = '';
    if (priority) priority.value = 'normal';
  }
  
  loadAdminGallery() {
    try {
      const result = simpleDatabase.getImages();
      const container = document.getElementById('admin-gallery');
      const totalImages = document.getElementById('total-images');
      
      if (!container) return;
      
      container.innerHTML = '';
      
      if (result.success && result.images.length > 0) {
        if (totalImages) totalImages.textContent = result.images.length;
        
        result.images.forEach((item) => {
          const div = document.createElement('div');
          div.className = 'admin-gallery-item';
          div.innerHTML = 
            '<img src="' + (item.url || item.image_url) + '" alt="' + (item.title || 'Image') + '" loading="lazy">' +
            '<h4>' + (item.title || 'Untitled') + '</h4>' +
            '<p>' + (item.description || '') + '</p>' +
            '<div class="image-meta">' +
            '<small>Category: ' + (item.category || 'general') + '</small><br>' +
            '<small>' + new Date(item.timestamp).toLocaleDateString() + '</small></div>' +
            '<div class="image-actions">' +
            '<button class="delete-image" data-id="' + item.id + '">🗑️ Delete</button></div>';
          container.appendChild(div);
        });
      } else {
        container.innerHTML = '<p class="no-data"><i class="fas fa-images"></i><br>No images in gallery</p>';
        if (totalImages) totalImages.textContent = '0';
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      this.showMessage('Error loading gallery', 'error');
    }
  }
  
  loadMessages() {
    try {
      const result = simpleDatabase.getMessages();
      const container = document.getElementById('messages-list');
      const totalMessages = document.getElementById('total-messages');
      
      if (!container) return;
      
      container.innerHTML = '';
      
      if (result.success && result.messages.length > 0) {
        if (totalMessages) totalMessages.textContent = result.messages.length;
        
        result.messages.forEach((message) => {
          const div = document.createElement('div');
          div.className = 'message-item ' + (message.read ? 'read' : 'unread');
          div.dataset.id = message.id;
          
          const date = new Date(message.timestamp).toLocaleString();
          
          div.innerHTML = 
            '<div class="message-header">' +
            '<strong>' + message.name + '</strong>' +
            '<span class="message-date">' + date + '</span>' +
            '<span class="message-status ' + (message.status || 'received') + '">' + (message.status || 'received') + '</span></div>' +
            '<div class="message-email">' + message.email + '</div>' +
            '<div class="message-subject">' + (message.subject || 'No subject') + '</div>' +
            '<div class="message-body">' + message.message + '</div>' +
            '<div class="message-actions">' +
            '<button class="mark-read" data-id="' + message.id + '">' + (message.read ? 'Mark Unread' : 'Mark Read') + '</button>' +
            '<button class="delete-message" data-id="' + message.id + '"><i class="fas fa-trash"></i> Delete</button></div>';
          
          container.appendChild(div);
        });
      } else {
        container.innerHTML = '<p class="no-data"><i class="fas fa-envelope"></i><br>No messages yet</p>';
        if (totalMessages) totalMessages.textContent = '0';
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      this.showMessage('Error loading messages', 'error');
    }
  }
  
  toggleMessageRead(messageId) {
    try {
      let messages = JSON.parse(localStorage.getItem('messages') || '[]');
      const index = messages.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        messages[index].read = !messages[index].read;
        messages[index].readAt = messages[index].read ? Date.now() : null;
        localStorage.setItem('messages', JSON.stringify(messages));
        this.showMessage('Message marked as ' + (messages[index].read ? 'read' : 'unread'));
        this.loadMessages();
      }
    } catch (error) {
      console.error('Error updating message:', error);
      this.showMessage('Error updating message status', 'error');
    }
  }
  
  deleteMessage(messageId) {
    try {
      let messages = JSON.parse(localStorage.getItem('messages') || '[]');
      messages = messages.filter(msg => msg.id !== messageId);
      localStorage.setItem('messages', JSON.stringify(messages));
      this.showMessage('Message deleted successfully!');
      this.loadMessages();
      this.loadStats();
    } catch (error) {
      console.error('Error deleting message:', error);
      this.showMessage('Error deleting message', 'error');
    }
  }
  
  loadBundlesForEdit() {
    const bundleSelect = document.getElementById('bundle-select');
    if (!bundleSelect) return;
    
    try {
      const result = simpleDatabase.getBundles();
      
      if (result.success) {
        // Keep first 4 options, remove rest
        while (bundleSelect.options.length > 4) {
          bundleSelect.remove(4);
        }
        
        Object.entries(result.bundles).forEach(([key, bundle]) => {
          if (bundle.visible !== false) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = bundle.name || key;
            bundleSelect.appendChild(option);
          }
        });
      }
    } catch (error) {
      console.error('Error loading bundles:', error);
    }
  }
  
  loadStats() {
    try {
      const galleryResult = simpleDatabase.getImages();
      const totalImages = document.getElementById('total-images');
      if (totalImages) {
        totalImages.textContent = galleryResult.success ? galleryResult.images.length : 0;
      }
      
      const messagesResult = simpleDatabase.getMessages();
      const totalMessages = document.getElementById('total-messages');
      const totalUpdates = document.getElementById('total-updates');
      const todayActivity = document.getElementById('today-activity');
      
      if (totalMessages) {
        totalMessages.textContent = messagesResult.success ? messagesResult.messages.length : 0;
      }
      
      if (totalUpdates) {
        totalUpdates.textContent = '0'; // No local storage for updates now
      }
      
      if (todayActivity) {
        const today = new Date().setHours(0,0,0,0);
        const todayMessages = messagesResult.success ? 
          messagesResult.messages.filter(msg => new Date(msg.timestamp) >= today).length : 0;
        todayActivity.textContent = todayMessages;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  showMessage(message, type = 'success') {
    const div = document.createElement('div');
    div.className = type + '-message';
    div.innerHTML = 
      '<i class="fas fa-' + (type === 'success' ? 'check-circle' : (type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle')) + '"></i>' +
      '<span>' + message + '</span>' +
      '<button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer;"><i class="fas fa-times"></i></button>';
    
    const adminHeader = document.querySelector('.admin-header');
    if (adminHeader) {
      adminHeader.parentNode.insertBefore(div, adminHeader.nextSibling);
    }
    
    setTimeout(() => {
      if (div.parentElement) div.remove();
    }, 5000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing admin panel...');
  new SimpleAdminPanel();
});
