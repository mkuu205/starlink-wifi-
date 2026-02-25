// Simple admin panel - Browser compatible version
console.log('Browser-compatible admin panel loading...');

// Simple authentication check
function isAdminAuthenticated() {
    return localStorage.getItem('adminAuthenticated') === 'true';
}

// Simple database functions using localStorage
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

// Admin Panel Class
class SimpleAdminPanel {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('Simple Admin panel initializing...');
        
        // Check authentication
        if (!isAdminAuthenticated()) {
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
        
        console.log('Simple Admin panel initialized successfully');
    }
    
    setupTabNavigation() {
        const tabs = document.querySelectorAll('.admin-menu a[data-tab]');
        console.log('Tabs found:', tabs.length);
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
                    console.log('Showing tab:', tabId);
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

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Message actions delegation
        document.addEventListener('click', (e) => {
            // Mark message as read
            if (e.target.closest('.mark-read')) {
                const button = e.target.closest('.mark-read');
                const messageId = button.dataset.id;
                this.toggleMessageRead(messageId);
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
        });
    }
    
    setupLogout() {
        // Already handled in setupEventListeners
    }
    
    logout() {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminEmail');
        window.location.href = 'admin-login.html';
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

            // Convert file to base64 URL for storage
            const reader = new FileReader();
            reader.onload = async (e) => {
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                
                // Create image data with base64 URL
                const imageData = {
                    id: `img_${Date.now()}`,
                    image_url: e.target.result, // base64 data URL
                    url: e.target.result, // fallback
                    title: title || '',
                    description: description || '',
                    category: category,
                    filename: file.name,
                    timestamp: Date.now(),
                    visible: true,
                    size: file.size,
                    type: file.type
                };
                
                // Store in localStorage
                let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
                gallery.push(imageData);
                localStorage.setItem('gallery', JSON.stringify(gallery));
                
                // Also send to Supabase backend if available
                try {
                    const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ imageData: imageData })
                    });
                    
                    if (response.ok) {
                        console.log('Image uploaded to backend successfully');
                    }
                } catch (backendError) {
                    console.warn('Backend upload failed, using local storage only:', backendError);
                }
                
                // Send notification to admin
                if (typeof emailNotifier !== 'undefined') {
                    try {
                        const notificationResult = await emailNotifier.sendImageUploadNotification(imageData);
                        if (notificationResult.success) {
                            console.log('Image upload notification sent to admin');
                        }
                    } catch (notificationError) {
                        console.error('Failed to send image upload notification:', notificationError);
                    }
                }
                
                setTimeout(() => {
                    this.showMessage('Image uploaded successfully!');
                    progressDiv.innerHTML = '';
                    this.clearUploadForm();
                    this.loadAdminGallery();
                }, 500);
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('Error uploading image. Please try again.', 'error');
        }
    }
    
    clearUploadForm() {
        const fileInput = document.getElementById('image-upload');
        const titleInput = document.getElementById('image-title');
        const descriptionInput = document.getElementById('image-description');
        const categorySelect = document.getElementById('image-category');
        const progressDiv = document.getElementById('upload-progress');
        
        if (fileInput) fileInput.value = '';
        if (titleInput) titleInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (categorySelect) categorySelect.value = 'general';
        if (progressDiv) progressDiv.innerHTML = '';
    }
    
    deleteImage(imageId) {
        try {
            let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
            gallery = gallery.filter(img => img.id !== imageId);
            localStorage.setItem('gallery', JSON.stringify(gallery));
            this.showMessage('Image deleted successfully!');
            this.loadAdminGallery();
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
            // Store in localStorage
            let bundles = JSON.parse(localStorage.getItem('bundles') || '{}');
            bundles[bundleType] = bundleData;
            localStorage.setItem('bundles', JSON.stringify(bundles));
            
            this.showMessage('Bundle updated successfully!');
            
            // Clear form
            nameInput.value = '';
            priceInput.value = '';
            featuresInput.value = '';
            
        } catch (error) {
            console.error('Error updating bundle:', error);
            this.showMessage('Error updating bundle', 'error');
        }
    }
    
    pushUpdate() {
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
            id: `update_${Date.now()}`,
            title: title,
            content: content,
            timestamp: Date.now(),
            type: 'site_update',
            priority: priority
        };
        
        try {
            // Save to localStorage
            let updates = JSON.parse(localStorage.getItem('site_updates') || '[]');
            updates.push(updateData);
            localStorage.setItem('site_updates', JSON.stringify(updates));
            
            this.clearUpdateForm();
            this.showMessage('Update pushed successfully!');
            
        } catch (error) {
            console.error('Error pushing update:', error);
            this.showMessage('Error pushing update', 'error');
        }
    }
    
    clearUpdateForm() {
        const titleInput = document.getElementById('update-title');
        const contentInput = document.getElementById('update-content');
        const prioritySelect = document.getElementById('update-priority');
        
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        if (prioritySelect) prioritySelect.value = 'normal';
    }
    
    loadAdminGallery() {
        try {
            const result = simpleDatabase.getImages();
            const galleryContainer = document.getElementById('admin-gallery');
            const totalImages = document.getElementById('total-images');
            
            if (galleryContainer) {
                galleryContainer.innerHTML = '';
                
                if (result.success && result.images.length > 0) {
                    if (totalImages) {
                        totalImages.textContent = result.images.length;
                    }
                    
                    result.images.forEach((item) => {
                        const galleryItem = document.createElement('div');
                        galleryItem.className = 'admin-gallery-item';
                        
                        galleryItem.innerHTML = `
                            <img src="${item.url}" alt="${item.title || 'Image'}" loading="lazy">
                            <h4>${item.title || 'Untitled'}</h4>
                            <p>${item.description || ''}</p>
                            <div class="image-meta">
                                <small>Category: ${item.category || 'general'}</small><br>
                                <small>${new Date(item.timestamp).toLocaleDateString()}</small>
                            </div>
                            <div class="image-actions">
                                <button class="delete-image" data-id="${item.id}">🗑️ Delete</button>
                            </div>
                        `;
                        
                        galleryContainer.appendChild(galleryItem);
                    });
                } else {
                    galleryContainer.innerHTML = '<p class="no-data"><i class="fas fa-images"></i><br>No images in gallery</p>';
                    if (totalImages) {
                        totalImages.textContent = '0';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.showMessage('Error loading gallery', 'error');
        }
    }
    
    loadMessages() {
        try {
            const result = simpleDatabase.getMessages();
            const messagesList = document.getElementById('messages-list');
            const totalMessages = document.getElementById('total-messages');
            
            if (messagesList) {
                messagesList.innerHTML = '';
                
                if (result.success && result.messages.length > 0) {
                    if (totalMessages) {
                        totalMessages.textContent = result.messages.length;
                    }
                    
                    result.messages.forEach((message) => {
                        const messageElement = document.createElement('div');
                        messageElement.className = `message-item ${message.read ? 'read' : 'unread'}`;
                        messageElement.dataset.id = message.id;
                        
                        const date = new Date(message.timestamp).toLocaleString();
                        
                        messageElement.innerHTML = `
                            <div class="message-header">
                                <strong>${message.name}</strong>
                                <span class="message-date">${date}</span>
                                <span class="message-status ${message.status || 'received'}">${message.status || 'received'}</span>
                            </div>
                            <div class="message-email">${message.email}</div>
                            <div class="message-subject">${message.subject || 'No subject'}</div>
                            <div class="message-body">${message.message}</div>
                            <div class="message-actions">
                                <button class="mark-read" data-id="${message.id}">
                                    ${message.read ? 'Mark Unread' : 'Mark Read'}
                                </button>
                                <button class="delete-message" data-id="${message.id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        `;
                        
                        messagesList.appendChild(messageElement);
                    });
                } else {
                    messagesList.innerHTML = '<p class="no-data"><i class="fas fa-envelope"></i><br>No messages yet</p>';
                    if (totalMessages) {
                        totalMessages.textContent = '0';
                    }
                }
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
                this.showMessage(`Message marked as ${messages[index].read ? 'read' : 'unread'}`);
                this.loadMessages(); // Refresh the list
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
            this.loadMessages(); // Refresh the list
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
            
            if (result.success && bundleSelect) {
                // Clear existing options except default
                while (bundleSelect.options.length > 4) {
                    bundleSelect.remove(4);
                }
                
                // Add bundles from database
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
            // Gallery stats
            const galleryResult = simpleDatabase.getImages();
            const totalImages = document.getElementById('total-images');
            
            if (totalImages) {
                totalImages.textContent = galleryResult.success ? galleryResult.images.length : 0;
            }
            
            // Messages stats
            const messagesResult = simpleDatabase.getMessages();
            const totalMessages = document.getElementById('total-messages');
            const todayActivity = document.getElementById('today-activity');
            
            if (totalMessages) {
                totalMessages.textContent = messagesResult.success ? messagesResult.messages.length : 0;
            }
            
            if (todayActivity) {
                const today = new Date().setHours(0,0,0,0);
                const todayMessages = messagesResult.success ? 
                    messagesResult.messages.filter(msg => 
                        new Date(msg.timestamp) >= today
                    ).length : 0;
                todayActivity.textContent = todayMessages;
            }
            
        } catch (error) {
            console.error('Error loading stats:', error);
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

// Initialize when DOM is loaded
console.log('Simple admin script loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SimpleAdminPanel...');
    new SimpleAdminPanel();
});