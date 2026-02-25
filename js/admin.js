// js/admin.js - Updated with Supabase and Nodemailer
import { adminAuth, database } from './supabase-config.js';
import { emailNotifier } from './nodemailer.js';

class AdminPanel {
    constructor() {
        this.init();
    }

    init() {
        console.log('Admin panel initializing...');
        
        // Check authentication
        if (!adminAuth.isAuthenticated()) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = 'admin-login.html';
            return;
        }
        
        console.log('Admin authenticated, setting up panel');
        
        this.setupTabNavigation();
        this.setupEventListeners();
        this.loadStats();
        this.loadAdminGallery();
        this.loadMessages();
        this.loadBundlesForEdit();
        this.setupLogout();
        this.loadNotifications();
        
        console.log('Admin panel initialized successfully');
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.admin-menu a[data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Hide all tab contents
                document.querySelectorAll('.admin-tab').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show selected tab content
                const tabId = tab.getAttribute('data-tab');
                const tabElement = document.getElementById(tabId);
                if (tabElement) {
                    tabElement.classList.add('active');
                }
            });
        });
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Image upload
        const uploadBtn = document.getElementById('upload-btn');
        console.log('Upload button found:', uploadBtn);
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadImage());
            console.log('Upload button event listener added');
        }
        
        // Clear upload form
        const clearUploadBtn = document.getElementById('clear-upload-form');
        if (clearUploadBtn) {
            clearUploadBtn.addEventListener('click', () => this.clearUploadForm());
        }

        // Bundle update
        const updateBundleBtn = document.getElementById('update-bundle');
        console.log('Update bundle button found:', updateBundleBtn);
        if (updateBundleBtn) {
            updateBundleBtn.addEventListener('click', () => this.updateBundle());
            console.log('Update bundle button event listener added');
        }

        // Push update
        const pushUpdateBtn = document.getElementById('push-update');
        console.log('Push update button found:', pushUpdateBtn);
        if (pushUpdateBtn) {
            pushUpdateBtn.addEventListener('click', () => this.pushUpdate());
            console.log('Push update button event listener added');
        }
        
        // Clear update form
        const clearUpdateBtn = document.getElementById('clear-update-form');
        if (clearUpdateBtn) {
            clearUpdateBtn.addEventListener('click', () => this.clearUpdateForm());
        }

        // Clear cache
        const clearCacheBtn = document.getElementById('clear-cache');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => this.clearCache());
        }
        
        // Test notification
        const testNotificationBtn = document.getElementById('test-notification');
        if (testNotificationBtn) {
            testNotificationBtn.addEventListener('click', () => this.sendTestNotification());
        }
        
        // Export data
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }
        
        // View emails
        const viewEmailsBtn = document.getElementById('view-emails');
        if (viewEmailsBtn) {
            viewEmailsBtn.addEventListener('click', () => this.viewSentEmails());
        }

        // Message actions delegation
        document.addEventListener('click', (e) => {
            // Mark message as read
            if (e.target.closest('.mark-read')) {
                const button = e.target.closest('.mark-read');
                const messageId = button.dataset.id;
                const messageElement = button.closest('.message-item');
                const isRead = messageElement.classList.contains('read');
                this.toggleMessageRead(messageId, !isRead);
            }
            
            // Delete message
            if (e.target.closest('.delete-message')) {
                const button = e.target.closest('.delete-message');
                const messageId = button.dataset.id;
                if (confirm('Are you sure you want to delete this message?')) {
                    this.deleteMessage(messageId);
                }
            }
            
            // Delete image
            if (e.target.closest('.delete-image')) {
                const button = e.target.closest('.delete-image');
                const imageId = button.dataset.id;
                if (confirm('Are you sure you want to delete this image?')) {
                    this.deleteImage(imageId);
                }
            }
            
            // Toggle image visibility
            if (e.target.closest('.toggle-visibility')) {
                const button = e.target.closest('.toggle-visibility');
                const imageId = button.dataset.id;
                const currentState = button.dataset.visible === 'true';
                this.toggleImageVisibility(imageId, !currentState);
            }
        });
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                adminAuth.logout();
                window.location.href = 'admin-login.html';
            });
        }
    }

    async uploadImage() {
        const fileInput = document.getElementById('image-upload');
        const title = document.getElementById('image-title').value;
        const description = document.getElementById('image-description').value;
        const category = document.getElementById('image-category').value;
        const progressDiv = document.getElementById('upload-progress');

        if (!fileInput.files[0]) {
            this.showMessage('Please select an image to upload', 'error');
            return;
        }

        const file = fileInput.files[0];
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('File size must be less than 5MB', 'error');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.showMessage('Please upload a valid image file (JPEG, PNG, GIF, WebP)', 'error');
            return;
        }

        progressDiv.innerHTML = '<div class="upload-progress-bar"><div class="progress"></div></div>';
        const progressBar = progressDiv.querySelector('.progress');

        try {
            // Show loading
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                progressBar.style.width = `${Math.min(progress, 90)}%`;
                if (progress >= 90) clearInterval(progressInterval);
            }, 100);

            const result = await database.uploadImage(file, title, description, category);
            
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            // Send email notification
            if (document.getElementById('email-notifications').checked) {
                await emailNotifier.sendImageUploadNotification({
                    title: title,
                    description: description,
                    category: category,
                    filename: file.name,
                    size: file.size,
                    timestamp: Date.now()
                });
            }
            
            setTimeout(() => {
                this.showMessage('Image uploaded successfully!');
                progressDiv.innerHTML = '';
                this.clearUploadForm();
                this.loadAdminGallery();
            }, 500);
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('Error uploading image. Please try again.', 'error');
        }
    }

    async deleteImage(imageId) {
        try {
            // Delete from Supabase
            await fetch(`/api/gallery/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            this.showMessage('Image deleted successfully!');
            this.loadAdminGallery();
        } catch (error) {
            console.error('Delete error:', error);
            this.showMessage('Error deleting image', 'error');
        }
    }

    async toggleImageVisibility(imageId, visible) {
        try {
            // Update image visibility in Supabase
            const response = await fetch(`/api/gallery/${imageId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ visible: visible })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update image visibility');
            }
            
            this.showMessage(`Image ${visible ? 'shown' : 'hidden'} successfully!`);
            this.loadAdminGallery();
        } catch (error) {
            console.error('Toggle error:', error);
            this.showMessage('Error updating image visibility', 'error');
        }
    }

    loadAdminGallery() {
        // Load gallery images from API
        fetch('/api/gallery')
            .then(response => response.json())
            .then(result => {
                if (!result.success) {
                    throw new Error(result.message || 'Failed to load gallery');
                }
                
                const data = result.data;
                const galleryContainer = document.getElementById('admin-gallery');
                const totalImages = document.getElementById('total-images');
                
                if (galleryContainer) {
                    galleryContainer.innerHTML = '';
                    
                    if (data && data.length > 0) {
                        if (totalImages) {
                            totalImages.textContent = data.length;
                        }
                        
                        data.forEach(item => {
                            const galleryItem = document.createElement('div');
                            galleryItem.className = 'admin-gallery-item';
                            
                            galleryItem.innerHTML = `
                                <img src="${item.url || item.image_url}" alt="${item.title || 'Image'}" loading="lazy">
                                <h4>${item.title || 'Untitled'}</h4>
                                <p>${item.description || ''}</p>
                                <div class="image-meta">
                                    <small>${new Date(item.created_at || item.timestamp).toLocaleDateString()}</small>
                                </div>
                                <div class="image-actions">
                                    <button class="toggle-visibility" data-id="${item.id}" data-visible="${item.visible !== false}">
                                        ${item.visible !== false ? '👁️ Hide' : '👁️ Show'}
                                    </button>
                                    <button class="delete-image" data-id="${item.id}">🗑️ Delete</button>
                                </div>
                            `;
                            
                            galleryContainer.appendChild(galleryItem);
                        });
                    } else {
                        galleryContainer.innerHTML = '<p class="no-data">No images in gallery</p>';
                        if (totalImages) {
                            totalImages.textContent = '0';
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error loading admin gallery:', error);
                const galleryContainer = document.getElementById('admin-gallery');
                if (galleryContainer) {
                    galleryContainer.innerHTML = '<p class="no-data">Error loading gallery</p>';
                }
            });
    }

    loadMessages() {
        // Load messages from API
        fetch('/api/messages')
            .then(response => response.json())
            .then(result => {
                if (!result.success) {
                    throw new Error(result.message || 'Failed to load messages');
                }
                
                const data = result.data;
                const messagesList = document.getElementById('messages-list');
                const totalMessages = document.getElementById('total-messages');
                
                if (messagesList) {
                    messagesList.innerHTML = '';
                    
                    if (data && data.length > 0) {
                        if (totalMessages) {
                            totalMessages.textContent = data.length;
                        }
                        
                        data.forEach(message => {
                            const messageElement = document.createElement('div');
                            messageElement.className = `message-item ${message.read ? 'read' : 'unread'}`;
                            messageElement.dataset.id = message.id;
                            
                            const date = new Date(message.created_at || message.timestamp).toLocaleString();
                            
                            messageElement.innerHTML = `
                                <div class="message-header">
                                    <strong>${message.name}</strong>
                                    <span class="message-date">${date}</span>
                                    <span class="message-status ${message.status || 'received'}">${message.status || 'received'}</span>
                                </div>
                                <div class="message-email">${message.email}</div>
                                <div class="message-subject">${message.service || 'No Subject'}</div>
                                <div class="message-body">${message.message}</div>
                                <div class="message-actions">
                                    <button class="mark-read" data-id="${message.id}">
                                        ${message.read ? 'Mark Unread' : 'Mark Read'}
                                    </button>
                                    <button class="reply-btn" data-email="${message.email}">
                                        <i class="fas fa-reply"></i> Reply
                                    </button>
                                    <button class="delete-message" data-id="${message.id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            `;
                            
                            messagesList.appendChild(messageElement);
                        });
                    } else {
                        messagesList.innerHTML = '<p class="no-data">No messages yet</p>';
                        if (totalMessages) {
                            totalMessages.textContent = '0';
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error loading messages:', error);
                const messagesList = document.getElementById('messages-list');
                if (messagesList) {
                    messagesList.innerHTML = '<p class="no-data">Error loading messages</p>';
                }
            });
    }

    async toggleMessageRead(messageId, read) {
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    read: read,
                    readAt: read ? Date.now() : null
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update message status');
            }
            
            this.showMessage(`Message marked as ${read ? 'read' : 'unread'}`);
        } catch (error) {
            console.error('Error updating message:', error);
            this.showMessage('Error updating message status', 'error');
        }
    }

    async deleteMessage(messageId) {
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete message');
            }
            
            this.showMessage('Message deleted successfully!');
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showMessage('Error deleting message', 'error');
        }
    }

    async loadBundlesForEdit() {
        const bundleSelect = document.getElementById('bundle-select');
        if (!bundleSelect) return;

        // Load bundles from API
        fetch('/api/bundles')
            .then(response => response.json())
            .then(result => {
                if (!result.success) {
                    throw new Error(result.message || 'Failed to load bundles');
                }
                
                const data = result.data;
                
                if (data && bundleSelect) {
                    // Clear existing options except default
                    while (bundleSelect.options.length > 4) {
                        bundleSelect.remove(4);
                    }
                    
                    // Add bundles from database
                    data.forEach(bundle => {
                        if (bundle.visible !== false) {
                            const option = document.createElement('option');
                            option.value = bundle.bundle_id || bundle.id;
                            option.textContent = bundle.name || bundle.id;
                            bundleSelect.appendChild(option);
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error loading bundles:', error);
            });
    }

    async updateBundle() {
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
            name: name,
            price: parseFloat(price),
            features: features.split('\n').filter(f => f.trim()),
            updated: Date.now(),
            visible: true
        };
        
        try {
            // Update bundle via API
            const response = await fetch(`/api/bundles/${bundleType}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bundleData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Bundle updated successfully!');
                
                // Clear form
                nameInput.value = '';
                priceInput.value = '';
                featuresInput.value = '';
                
                // Push notification
                await this.pushUpdateToClients(`Bundle "${name}" has been updated!`);
            } else {
                throw new Error(result.message || 'Failed to update bundle');
            }
        } catch (error) {
            console.error('Error updating bundle:', error);
            this.showMessage('Error updating bundle', 'error');
        }
    }

    async pushUpdate() {
        const updateTitle = document.getElementById('update-title');
        const updateContent = document.getElementById('update-content');
        const updatePriority = document.getElementById('update-priority');
        
        if (!updateContent) return;
        
        const title = updateTitle ? updateTitle.value : 'Site Update';
        const content = updateContent.value;
        const priority = updatePriority ? updatePriority.value : 'normal';
        
        if (!content) {
            this.showMessage('Please enter update content', 'error');
            return;
        }
        
        const updateData = {
            title: title,
            content: content,
            timestamp: Date.now(),
            type: 'site_update',
            priority: priority
        };
        
        try {
            // Send notification to all clients
            await this.pushUpdateToClients(content);
            
            // Store in localStorage for client-side retrieval
            let updates = JSON.parse(localStorage.getItem('site_updates') || '[]');
            updates.push(updateData);
            localStorage.setItem('site_updates', JSON.stringify(updates));
            
            updateContent.value = '';
            if (updateTitle) updateTitle.value = '';
            if (updatePriority) updatePriority.value = 'normal';
            
            this.showMessage('Update pushed successfully!');
            
            // Update stats
            this.updateUpdatesCount();
        } catch (error) {
            console.error('Error pushing update:', error);
            this.showMessage('Error pushing update', 'error');
        }
    }

    async pushUpdateToClients(message) {
        try {
            // Send notification via API
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: process.env.ADMIN_EMAIL || 'starlinktokenwifi@gmail.com',
                    subject: 'Site Update Notification',
                    content: message,
                    template: 'admin'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send notification');
            }
            
            console.log('Notification sent:', message);
        } catch (error) {
            console.error('Error in push notification:', error);
        }
    }

    async loadStats() {
        try {
            // Gallery stats
            const galleryResponse = await fetch('/api/gallery');
            const galleryResult = await galleryResponse.json();
            const totalImages = document.getElementById('total-images');
            
            if (totalImages && galleryResult.success) {
                totalImages.textContent = galleryResult.count || 0;
            }
            
            // Messages stats
            const messagesResponse = await fetch('/api/messages');
            const messagesResult = await messagesResponse.json();
            const totalMessages = document.getElementById('total-messages');
            const todayActivity = document.getElementById('today-activity');
            
            if (totalMessages && messagesResult.success) {
                totalMessages.textContent = messagesResult.count || 0;
            }
            
            if (todayActivity && messagesResult.data) {
                const today = new Date().setHours(0,0,0,0);
                const todayMessages = messagesResult.data ? 
                    messagesResult.data.filter(msg => 
                        new Date(msg.created_at).getTime() >= today
                    ).length : 0;
                todayActivity.textContent = todayMessages;
            }
            
            // Updates count
            await this.updateUpdatesCount();
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async updateUpdatesCount() {
        try {
            const updates = JSON.parse(localStorage.getItem('site_updates') || '[]');
            const totalUpdates = document.getElementById('total-updates');
            
            if (totalUpdates) {
                totalUpdates.textContent = updates.length;
            }
        } catch (error) {
            console.error('Error updating updates count:', error);
        }
    }

    clearCache() {
        if (confirm('Are you sure you want to clear all cache? This will log out all users.')) {
            // Clear local storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear service worker cache
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => registration.unregister());
                });
            }
            
            // Clear cookies
            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            this.showMessage('Cache cleared successfully! Please refresh the page.');
        }
    }

    showMessage(message, type = 'success') {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to admin header
        const adminHeader = document.querySelector('.admin-header');
        if (adminHeader) {
            adminHeader.parentNode.insertBefore(messageDiv, adminHeader.nextSibling);
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Initialize admin panel when DOM is loaded
console.log('DOM Content Loaded event fired');
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AdminPanel...');
    new AdminPanel();
});
