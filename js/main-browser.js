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
        console.warn('Supabase client library not loaded. Gallery features will not work.');
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
            
            // Open messages modal instead of scrolling
            if (typeof openMessagesModal === 'function') {
                openMessagesModal();
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
    loadBundles();
    if (supabaseInitialized) {
        loadGalleryPreview();
        // Start checking for updates
        checkForUpdates();
        // Set up periodic update checking
        setInterval(checkForUpdates, 30000);
    }
    
    // Set up contact form and message notification
    setupContactForm();
    updateMessageCount();
    
    // Update message count periodically
    setInterval(updateMessageCount, 60000);
});

// Function to check for admin updates
async function checkForUpdates() {
    try {
        const updates = JSON.parse(localStorage.getItem('site_updates') || '[]');
        if (updates.length > 0) {
            const latestUpdate = updates[updates.length - 1];
            showNotification(latestUpdate.title || 'Site Update', latestUpdate.content);
            localStorage.setItem('site_updates', JSON.stringify([]));
        }
        
        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('notifications')
                .select('*')
                .eq('sent', true)
                .order('timestamp', { ascending: false })
                .limit(1);
            
            if (!error && data && data.length > 0) {
                const notification = data[0];
                showNotification('New Update', notification.message);
                
                await supabaseClient
                    .from('notifications')
                    .update({ delivered: true })
                    .eq('id', notification.id);
            }
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
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

// Setup contact form submission
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
                const response = await fetch('https://starlink-wifi-backend.onrender.com/api/contact', {
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
                    
                    if (typeof updateMessageCount === 'function') {
                        updateMessageCount();
                    }
                    
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

// Update message count badge
async function updateMessageCount() {
    try {
        let unreadCount = 0;
        
        if (supabaseClient) {
            const { count, error } = await supabaseClient
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('read', false);
            
            if (!error && count !== null) {
                unreadCount = count;
            }
        }
        
        const messageCount = document.getElementById('message-count');
        
        if (messageCount) {
            messageCount.textContent = unreadCount;
            messageCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
    } catch (error) {
        console.error('Error updating message count:', error);
    }
}

// Load bundles
function loadBundles() {
    const bundlesContainer = document.getElementById('bundles-container');
    
    if (!bundlesContainer) return;
    
    try {
        const defaultBundles = {
            daily: {
                id: 'daily',
                name: 'Daily Bundle',
                price: 50,
                features: ['500MB Data', '24 Hours Validity', 'High Speed', 'No Expiry'],
                visible: true
            },
            weekly: {
                id: 'weekly',
                name: 'Weekly Bundle',
                price: 200,
                features: ['3GB Data', '7 Days Validity', 'High Speed', 'No Expiry'],
                visible: true
            },
            monthly: {
                id: 'monthly',
                name: 'Monthly Bundle',
                price: 500,
                features: ['15GB Data', '30 Days Validity', 'High Speed', 'No Expiry'],
                visible: true
            },
            business: {
                id: 'business',
                name: 'Business Bundle',
                price: 1500,
                features: ['50GB Data', '30 Days Validity', 'Priority Support', 'Static IP', '24/7 Support'],
                visible: true,
                featured: true
            }
        };
        
        bundlesContainer.innerHTML = '';
        
        Object.values(defaultBundles).forEach(bundle => {
            if (bundle.visible !== false) {
                bundlesContainer.appendChild(createBundleCard(bundle, bundle.id));
            }
        });
        
    } catch (error) {
        console.error('Error loading bundles:', error);
        bundlesContainer.innerHTML = `
            <div class="no-bundles" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                <h3>Unable to Load Bundles</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

function createBundleCard(bundle, key) {
    const bundleCard = document.createElement('div');
    bundleCard.className = `bundle-card ${bundle.featured ? 'featured' : ''}`;
    
    const featuresList = bundle.features 
        ? bundle.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')
        : '';
    
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
            .order('timestamp', { ascending: false })
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
            .order('timestamp', { ascending: false });
        
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

// MESSAGES FUNCTIONS
async function loadMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        messages = data || [];
        displayMessages(messages);
        
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Error Loading Messages</h3>
                <p>${error.message || 'Please try again later'}</p>
                <button onclick="loadMessages()" class="btn btn-secondary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function displayMessages(messagesList) {
    const container = document.getElementById('messagesContainer');
    
    if (!messagesList || messagesList.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-envelope-open" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p>No messages yet</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    messagesList.forEach(message => {
        const time = new Date(message.created_at).toLocaleString();
        const isUnread = !message.read;
        const phoneDisplay = message.phone ? message.phone : 'No phone provided';
        
        html += `
            <div class="message-item ${isUnread ? 'unread' : ''}" data-id="${message.id}" onclick="markMessageAsRead('${message.id}')">
                <div class="message-header">
                    <div class="message-sender">${message.name || 'Unknown'}</div>
                    <div class="message-time">${time}</div>
                </div>
                <div>
                    ${message.service ? `<span class="message-service">${message.service}</span>` : ''}
                    <span style="color: #666; font-size: 0.9rem;">${phoneDisplay}</span>
                </div>
                <div style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-envelope"></i> ${message.email}
                </div>
                <div class="message-content">${message.message || 'No message content'}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function markMessageAsRead(messageId) {
    try {
        if (!supabaseClient) return;
        
        const { error } = await supabaseClient
            .from('messages')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', messageId);
        
        if (error) throw error;
        
        const item = document.querySelector(`.message-item[data-id="${messageId}"]`);
        if (item) {
            item.classList.remove('unread');
        }
        
        loadUnreadCount();
        
    } catch (error) {
        console.error('Error marking message as read:', error);
        showNotification('Error updating message status', 'error');
    }
}

async function markAllAsRead() {
    try {
        if (!supabaseClient) return;
        
        const { error } = await supabaseClient
            .from('messages')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('read', false);
        
        if (error) throw error;
        
        document.querySelectorAll('.message-item').forEach(item => {
            item.classList.remove('unread');
        });
        
        loadUnreadCount();
        
        showNotification('All messages marked as read', 'success');
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        showNotification('Error updating messages', 'error');
    }
}

async function loadUnreadCount() {
    try {
        if (!supabaseClient) return;
        
        const { count, error } = await supabaseClient
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('read', false);
        
        if (error) throw error;
        
        updateBadge(count || 0);
        
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

function updateBadge(count) {
    const badge = document.getElementById('message-count');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function openMessagesModal() {
    const modal = document.getElementById('messagesModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadMessages();
    }
}

function closeMessagesModal() {
    const modal = document.getElementById('messagesModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        loadUnreadCount();
    }
}

function refreshMessages() {
    loadMessages();
    showNotification('Messages refreshed', 'success');
}

function exportMessages() {
    const messages = [];
    const messageItems = document.querySelectorAll('.message-item');
    
    messageItems.forEach(item => {
        const sender = item.querySelector('.message-sender').textContent;
        const time = item.querySelector('.message-time').textContent;
        const content = item.querySelector('.message-content').textContent;
        messages.push({ sender, time, content });
    });
    
    if (messages.length === 0) {
        showNotification('No messages to export', 'warning');
        return;
    }
    
    const headers = ['Sender', 'Time', 'Message'];
    const csvRows = [
        headers.join(','),
        ...messages.map(msg => [
            `"${msg.sender || ''}"`,
            `"${msg.time || ''}"`,
            `"${msg.content || ''}"`
        ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Messages exported successfully', 'success');
}

// Contact action functions
function callNow() {
    const phoneNumber = '0740851330';
    if (confirm(`Call ${phoneNumber}?`)) {
        window.location.href = `tel:${phoneNumber}`;
    }
}

function sendEmail() {
    const email = 'starlinktokenwifi@gmail.com';
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
window.updateMessageCount = updateMessageCount;
window.openMessagesModal = openMessagesModal;
window.closeMessagesModal = closeMessagesModal;
window.markAllAsRead = markAllAsRead;
window.refreshMessages = refreshMessages;
window.exportMessages = exportMessages;
window.callNow = callNow;
window.sendEmail = sendEmail;
window.openLocation = openLocation;
window.openFacebook = openFacebook;
window.openTwitter = openTwitter;
window.openInstagram = openInstagram;

console.log('Browser-compatible main script initialized');
