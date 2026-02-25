// Browser-compatible main script with Supabase

console.log('Browser-compatible main script loading...');

// Supabase configuration
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ';

// Initialize Supabase client
let supabaseClient = null;

function initializeSupabase() {
    if (window.supabase && window.supabase.createClient) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            return false;
        }
    } else {
        console.warn('Supabase client library not loaded. Some features will not work.');
        console.warn('Make sure to load Supabase CDN before this script.');
        return false;
    }
}

// Global Functions for Bundle and Gallery Controls
function showBundles() {
    const bundlesSection = document.getElementById('bundles');
    if (!bundlesSection) return;
    
    bundlesSection.style.display = 'block';
    bundlesSection.scrollIntoView({ behavior: 'smooth' });
    
    // Load bundles if not already loaded
    if (!document.querySelector('.bundle-card')) {
        loadBundles();
    }
}

function hideBundles() {
    const bundlesSection = document.getElementById('bundles');
    const homeSection = document.getElementById('home');
    if (!bundlesSection || !homeSection) return;
    
    bundlesSection.style.display = 'none';
    homeSection.scrollIntoView({ behavior: 'smooth' });
}

function openGalleryModal() {
    const galleryModal = document.getElementById('galleryModal');
    if (!galleryModal) return;
    
    galleryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Load full gallery if not already loaded
    if (!document.querySelector('.modal-gallery-item')) {
        loadFullGallery();
    }
}

function closeGalleryModal() {
    const galleryModal = document.getElementById('galleryModal');
    if (!galleryModal) return;
    
    galleryModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Initialize main functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing main functions...');
    
    // Initialize Supabase first
    const supabaseInitialized = initializeSupabase();
    
    // Mobile menu toggle
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }

    // Fix messages button - prevent scroll behavior
    const messagesBtn = document.getElementById('messages-notification');
    if (messagesBtn) {
        messagesBtn.onclick = null;
        messagesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Open notifications modal instead of scrolling
            if (typeof openNotificationsModal === 'function') {
                openNotificationsModal();
            }
        }, true);
        
        const parentLi = messagesBtn.closest('li');
        if (parentLi) {
            parentLi.addEventListener('click', function(e) {
                if (e.target.closest('#messages-notification')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        }
    }
    
    // Smooth scrolling for anchor links (excluding messages button)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.id === 'messages-notification') return;
        
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#') && 
                this.getAttribute('href') !== '#') {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Load bundles and gallery preview (only if Supabase is available)
    if (supabaseInitialized) {
        loadBundles();
        loadGalleryPreview();
        // Load notifications for the modal
        loadNotifications();
        // Check for new notifications periodically
        setInterval(checkForNewNotifications, 30000);
    }
    
    // Set up contact form (sends to email, not database)
    setupContactForm();
});

// Function to check for new notifications
async function checkForNewNotifications() {
    try {
        if (!supabaseClient) return;
        
        // Get the last checked time from localStorage
        const lastChecked = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString();
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('sent', true)
            .gt('created_at', lastChecked)
            .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
            // Show notification for new updates
            const latestNotification = data[0];
            showNotification('New Update', latestNotification.message);
            
            // Update notifications badge
            updateNotificationsBadge();
            
            // Reload notifications if modal is open
            const modal = document.getElementById('messagesModal');
            if (modal && modal.style.display === 'block') {
                displayNotifications(data);
            }
            
            // Update last checked time
            localStorage.setItem('lastNotificationCheck', new Date().toISOString());
        }
    } catch (error) {
        console.error('Error checking for new notifications:', error);
    }
}

// Function to show notification toast
function showNotification(title, message) {
    const toast = document.getElementById('notification-toast');
    const messageElement = document.getElementById('notification-message');
    
    if (toast && messageElement) {
        messageElement.innerHTML = `<strong>${title}:</strong> ${message}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }
}

// Function to close notification
function closeNotification() {
    const toast = document.getElementById('notification-toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

// Setup contact form submission (sends to email only)
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value;
            const formMessage = document.getElementById('form-message');
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                // Determine backend URL based on environment
                const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:3000'
                    : 'https://starlink-wifi-backend-v862.onrender.com';
                
                const response = await fetch(`${backendUrl}/api/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        phone: phone,
                        service: service,
                        message: message
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    formMessage.innerHTML = '<p class="success">Message sent successfully! We\'ll contact you soon.</p>';
                    formMessage.style.color = 'green';
                    form.reset();
                    
                } else {
                    throw new Error(result.message || 'Failed to send message');
                }
                
            } catch (error) {
                console.error('Error sending message:', error);
                formMessage.innerHTML = '<p class="error">Error sending message. Please try again or call us directly.</p>';
                formMessage.style.color = 'red';
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    formMessage.innerHTML = '';
                }, 5000);
            }
        });
    }
}

// Load bundles from Supabase
async function loadBundles() {
    const bundlesContainer = document.getElementById('bundles-container');
    
    if (!bundlesContainer) return;
    
    // Show loading state
    bundlesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6; margin-bottom: 1rem;"></i>
            <h3>Loading Bundles...</h3>
            <p>Please wait while we fetch the latest packages</p>
        </div>
    `;
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized. Please refresh the page.');
        }
        
        // Fetch bundles from Supabase
        const { data, error } = await supabaseClient
            .from('bundles')
            .select('*')
            .eq('visible', true)
            .order('created_at', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        bundlesContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            // Show empty state
            bundlesContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                    <h3>No Bundles Available</h3>
                    <p>Please check back later for our internet packages</p>
                </div>
            `;
            return;
        }
        
        // Display bundles from Supabase
        data.forEach(bundle => {
            bundlesContainer.appendChild(createBundleCard(bundle, bundle.id));
        });
        
    } catch (error) {
        console.error('Error loading bundles from Supabase:', error);
        bundlesContainer.innerHTML = `
            <div class="no-bundles" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Unable to Load Bundles</h3>
                <p>${error.message || 'Please try again later'}</p>
                <button onclick="loadBundles()" class="btn btn-secondary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function createBundleCard(bundle, key) {
    const bundleCard = document.createElement('div');
    bundleCard.className = `bundle-card ${bundle.featured ? 'featured' : ''}`;
    
    // Handle features - could be array or comma-separated string
    let featuresList = '';
    if (bundle.features) {
        if (Array.isArray(bundle.features)) {
            featuresList = bundle.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('');
        } else if (typeof bundle.features === 'string') {
            // If features is a comma-separated string
            const featuresArray = bundle.features.split(',').map(f => f.trim());
            featuresList = featuresArray.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('');
        }
    }
    
    bundleCard.innerHTML = `
        <h3>${bundle.name || 'Bundle'}</h3>
        <div class="price">KSh ${bundle.price || '0'}</div>
        <ul>${featuresList}</ul>
        <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="selectBundle('${key}')">
            <i class="fas fa-shopping-cart"></i> Select Package
        </button>
    `;
    
    return bundleCard;
}

// Load gallery preview from Supabase
async function loadGalleryPreview() {
    const previewContainer = document.getElementById('gallery-preview-container');
    
    if (!previewContainer) return;
    
    previewContainer.innerHTML = `
        <div class="loading-gallery">
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
        </div>
    `;
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized. Please refresh the page.');
        }
        
        const { data, error } = await supabaseClient
            .from('gallery')
            .select('id, title, description, category, image_url, visible')
            .eq('visible', true)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (error) {
            throw error;
        }
        
        previewContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            previewContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-images" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                    <h3>No Gallery Items Yet</h3>
                    <p>Check back soon for project images</p>
                </div>
            `;
            return;
        }
        
        data.forEach(item => {
            previewContainer.appendChild(createGalleryPreviewItem(item, item.id));
        });
        
    } catch (error) {
        console.error('Error loading gallery preview from Supabase:', error);
        previewContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Unable to Load Gallery</h3>
                <p>${error.message || 'Please try again later'}</p>
                <button onclick="loadGalleryPreview()" class="btn btn-secondary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function createGalleryPreviewItem(item, key) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-preview-item';
    
    const imageUrl = item.image_url || item.url;
    
    galleryItem.innerHTML = `
        <img src="${imageUrl}" alt="${item.title || 'Project Image'}" loading="lazy">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 1rem;">
            <h4 style="margin: 0; font-size: 1rem;">${item.title || 'Project'}</h4>
            <p style="margin: 0.5rem 0 0; font-size: 0.875rem; opacity: 0.9;">${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') : ''}</p>
        </div>
    `;
    
    return galleryItem;
}

// Load full gallery for modal from Supabase
async function loadFullGallery() {
    const modalContainer = document.getElementById('modalGalleryContainer');
    
    if (!modalContainer) return;
    
    modalContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>
            <p>Loading gallery images...</p>
        </div>
    `;
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized. Please refresh the page.');
        }
        
        const { data, error } = await supabaseClient
            .from('gallery')
            .select('id, title, description, category, image_url, visible')
            .eq('visible', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        modalContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            modalContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                    <i class="fas fa-images" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                    <h3>No Gallery Items Available</h3>
                    <p>Check back soon for project images</p>
                </div>
            `;
            return;
        }
        
        data.forEach((item, index) => {
            modalContainer.appendChild(createModalGalleryItem(item, `full-${item.id}-${index}`));
        });
        
        setupGalleryFilters();
        
    } catch (error) {
        console.error('Error loading full gallery from Supabase:', error);
        modalContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Unable to Load Gallery</h3>
                <p>${error.message || 'Please try again later'}</p>
                <button onclick="loadFullGallery()" class="btn btn-secondary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function createModalGalleryItem(item, key) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'modal-gallery-item';
    galleryItem.dataset.filter = item.category || 'all';
    
    const imageUrl = item.image_url || item.url;
    
    galleryItem.innerHTML = `
        <img src="${imageUrl}" alt="${item.title || 'Project Image'}" loading="lazy" data-full-src="${imageUrl}">
    `;
    
    galleryItem.addEventListener('click', () => {
        showFullImage(imageUrl, item.title || 'Project Image');
    });
    
    return galleryItem;
}

// Function to show full-size image in modal
function showFullImage(imageUrl, title) {
    let fullImageModal = document.getElementById('fullImageModal');
    if (!fullImageModal) {
        fullImageModal = document.createElement('div');
        fullImageModal.id = 'fullImageModal';
        fullImageModal.className = 'full-image-modal';
        fullImageModal.innerHTML = `
            <div class="full-image-container">
                <button class="full-image-close" id="fullImageClose">
                    <i class="fas fa-times"></i>
                </button>
                <img id="fullImage" src="" alt="">
            </div>
        `;
        document.body.appendChild(fullImageModal);
        
        document.getElementById('fullImageClose').addEventListener('click', closeFullImage);
        fullImageModal.addEventListener('click', (e) => {
            if (e.target === fullImageModal) {
                closeFullImage();
            }
        });
    }
    
    document.getElementById('fullImage').src = imageUrl;
    document.getElementById('fullImage').alt = title;
    fullImageModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Function to close full image modal
function closeFullImage() {
    const fullImageModal = document.getElementById('fullImageModal');
    if (fullImageModal) {
        fullImageModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function setupGalleryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            filterGalleryItems(filter);
        });
    });
}

function filterGalleryItems(filter) {
    const galleryItems = document.querySelectorAll('.modal-gallery-item');
    
    galleryItems.forEach(item => {
        const itemFilter = item.dataset.filter || 'all';
        
        if (filter === 'all' || itemFilter === filter) {
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
            }, 100);
        } else {
            item.style.opacity = '0';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

// Bundle selection
function selectBundle(bundleId) {
    alert(`Thank you for selecting bundle ${bundleId}! Our sales team will contact you shortly.`);
    openWhatsApp();
}

// WhatsApp contact function
function openWhatsApp() {
    const phoneNumber = '254740851330';
    const message = 'Hello! I am interested in your WiFi bundles. Please contact me.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// NOTIFICATIONS FUNCTIONS (for admin updates)
async function loadNotifications() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading notifications...</div>';
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('sent', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        displayNotifications(data || []);
        updateNotificationsBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Error Loading Notifications</h3>
                <p>${error.message || 'Please try again later'}</p>
                <button onclick="loadNotifications()" class="btn btn-secondary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('messagesContainer');
    
    if (!container) return;
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-bell-slash" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    notifications.forEach(notification => {
        const time = new Date(notification.created_at).toLocaleString();
        const isNew = !notification.read_by?.includes(getCurrentUserId());
        
        html += `
            <div class="message-item ${isNew ? 'unread' : ''}" data-id="${notification.id}" onclick="markNotificationAsRead('${notification.id}')">
                <div class="message-header">
                    <div class="message-sender">
                        <i class="fas fa-bullhorn" style="color: #3b82f6; margin-right: 0.5rem;"></i>
                        Admin Update
                    </div>
                    <div class="message-time">${time}</div>
                </div>
                ${notification.title ? `<div style="font-weight: bold; margin: 0.5rem 0; color: #333;">${notification.title}</div>` : ''}
                <div class="message-content">${notification.message || notification.content || ''}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Store last viewed time
    localStorage.setItem('lastNotificationsView', new Date().toISOString());
}

// Helper function to get current user ID (you can implement this based on your user system)
function getCurrentUserId() {
    // For now, use a session-based or localStorage ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}

async function markNotificationAsRead(notificationId) {
    try {
        if (!supabaseClient) return;
        
        const userId = getCurrentUserId();
        
        // Get current notification
        const { data: notification } = await supabaseClient
            .from('notifications')
            .select('read_by')
            .eq('id', notificationId)
            .single();
        
        const readBy = notification?.read_by || [];
        if (!readBy.includes(userId)) {
            readBy.push(userId);
            
            await supabaseClient
                .from('notifications')
                .update({ read_by: readBy })
                .eq('id', notificationId);
        }
        
        const item = document.querySelector(`.message-item[data-id="${notificationId}"]`);
        if (item) {
            item.classList.remove('unread');
        }
        
        updateNotificationsBadge();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        if (!supabaseClient) return;
        
        const userId = getCurrentUserId();
        const unreadItems = document.querySelectorAll('.message-item.unread');
        
        for (const item of unreadItems) {
            const notificationId = item.dataset.id;
            
            // Get current notification
            const { data: notification } = await supabaseClient
                .from('notifications')
                .select('read_by')
                .eq('id', notificationId)
                .single();
            
            const readBy = notification?.read_by || [];
            if (!readBy.includes(userId)) {
                readBy.push(userId);
                
                await supabaseClient
                    .from('notifications')
                    .update({ read_by: readBy })
                    .eq('id', notificationId);
            }
            
            item.classList.remove('unread');
        }
        
        updateNotificationsBadge();
        showNotification('Success', 'All notifications marked as read');
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        showNotification('Error updating notifications', 'error');
    }
}

async function updateNotificationsBadge() {
    try {
        if (!supabaseClient) return;
        
        const userId = getCurrentUserId();
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('read_by')
            .eq('sent', true);
        
        if (error) throw error;
        
        // Count notifications where user hasn't read them
        const unreadCount = data.filter(n => !n.read_by?.includes(userId)).length;
        
        const badge = document.getElementById('message-count');
        if (!badge) return;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error updating notifications badge:', error);
    }
}

function openNotificationsModal() {
    const modal = document.getElementById('messagesModal');
    const modalTitle = document.getElementById('messagesModalTitle');
    
    if (modal) {
        // Update modal title
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-bell"></i> Notifications & Updates';
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadNotifications();
    }
}

function closeMessagesModal() {
    const modal = document.getElementById('messagesModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        updateNotificationsBadge();
    }
}

function refreshNotifications() {
    loadNotifications();
    showNotification('Refreshed', 'Notifications updated');
}

// Contact action functions
function callNow() {
    const phoneNumber = '0740851330';
    if (confirm(`Call ${phoneNumber}?`)) {
        window.location.href = `tel:${phoneNumber}`;
    }
}

function sendEmail() {
    const email = 'support@starlinktokenwifi.com;
    const subject = 'Inquiry about Starlink Token WiFi Services';
    const body = 'Hello Starlink Token WiFi,\n\nI would like to inquire about your services.\n\nBest regards,';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
}

function openLocation() {
    const address = 'Nakuru, Kenya';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
}

// Social media functions
function openFacebook() {
    window.open('https://facebook.com', '_blank');
}

function openTwitter() {
    window.open('https://twitter.com', '_blank');
}

function openInstagram() {
    window.open('https://instagram.com', '_blank');
}

// Export functions for global use
window.showBundles = showBundles;
window.hideBundles = hideBundles;
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.selectBundle = selectBundle;
window.loadBundles = loadBundles;
window.loadGalleryPreview = loadGalleryPreview;
window.loadFullGallery = loadFullGallery;
window.openWhatsApp = openWhatsApp;
window.showNotification = showNotification;
window.closeNotification = closeNotification;
window.openNotificationsModal = openNotificationsModal;
window.closeMessagesModal = closeMessagesModal;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.refreshNotifications = refreshNotifications;
window.callNow = callNow;
window.sendEmail = sendEmail;
window.openLocation = openLocation;
window.openFacebook = openFacebook;
window.openTwitter = openTwitter;
window.openInstagram = openInstagram;

console.log('Browser-compatible main script initialized');
