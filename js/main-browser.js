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
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing main functions...');
    
    // Initialize Supabase first
    var supabaseInitialized = initializeSupabase();
    
    // Mobile menu toggle
    var mobileMenu = document.querySelector('.mobile-menu');
    var navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            if (navLinks.classList.contains('active')) {
                mobileMenu.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                mobileMenu.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }

    // Fix messages notification button
    var messagesBtn = document.getElementById('messages-notification');
    if (messagesBtn) {
        // Remove any existing handlers
        messagesBtn.onclick = null;
        
        // Add direct click handler
        messagesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Messages button clicked');
            
            // Open notifications modal - use the global function
            if (typeof window.openNotificationsModal === 'function') {
                window.openNotificationsModal();
            } else {
                console.error('openNotificationsModal function not found');
                // Fallback
                var modal = document.getElementById('messagesModal');
                if (modal) {
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                    loadNotifications();
                }
            }
        });
    }
    
    // Smooth scrolling for anchor links only
    var anchors = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchors.length; i++) {
        var anchor = anchors[i];
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href.startsWith('#') && href !== '#') {
                e.preventDefault();
                var target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    // Load bundles and gallery preview (only if Supabase is available)
    if (supabaseInitialized) {
        loadBundles();
        loadGalleryPreview();
        // Load notifications for the modal
        loadNotifications();
        // Check for new notifications periodically
        setInterval(checkForNewNotifications, 30000);
    } else {
        // Show error message if Supabase not initialized
        showSupabaseError();
    }
    
    // Set up contact form
    setupContactForm();
});

function showSupabaseError() {
    // Show error in bundles and gallery sections
    var bundlesContainer = document.getElementById('bundles-container');
    var previewContainer = document.getElementById('gallery-preview-container');
    
    if (bundlesContainer) {
        bundlesContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
            '<h3>Connection Error</h3>' +
            '<p>Unable to connect to server. Please refresh the page.</p>' +
            '</div>';
    }
    
    if (previewContainer) {
        previewContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
            '<h3>Connection Error</h3>' +
            '<p>Unable to load gallery. Please refresh the page.</p>' +
            '</div>';
    }
}

// Function to check for new notifications
async function checkForNewNotifications() {
    try {
        if (!supabaseClient) return;
        
        // Get the last checked time from localStorage
        var lastChecked = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString();
        
        var { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('sent', true)
            .gt('created_at', lastChecked)
            .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
            // Show notification for new updates
            var latestNotification = data[0];
            showNotification('New Update', latestNotification.message || latestNotification.content);
            
            // Update notifications badge
            updateNotificationsBadge();
            
            // Reload notifications if modal is open
            var modal = document.getElementById('messagesModal');
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
    var toast = document.getElementById('notification-toast');
    var messageElement = document.getElementById('notification-message');
    
    if (toast && messageElement) {
        messageElement.innerHTML = '<strong>' + title + ':</strong> ' + message;
        toast.classList.add('show');
        
        setTimeout(function() {
            toast.classList.remove('show');
        }, 5000);
    }
}

// Function to close notification
function closeNotification() {
    var toast = document.getElementById('notification-toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

// Setup contact form submission
function setupContactForm() {
    var form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            var name = document.getElementById('name').value;
            var email = document.getElementById('email').value;
            var phone = document.getElementById('phone').value;
            var service = document.getElementById('service').value;
            var message = document.getElementById('message').value;
            var formMessage = document.getElementById('form-message');
            
            var submitBtn = form.querySelector('button[type="submit"]');
            var originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                // Determine backend URL based on environment
                var backendUrl;
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    backendUrl = 'http://localhost:3000';
                } else {
                    backendUrl = 'https://starlink-wifi-backend-v862.onrender.com';
                }
                
                var response = await fetch(backendUrl + '/api/contact', {
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
                
                var result = await response.json();
                
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
                
                setTimeout(function() {
                    formMessage.innerHTML = '';
                }, 5000);
            }
        });
    }
}

// Load bundles from Supabase
async function loadBundles() {
    var bundlesContainer = document.getElementById('bundles-container');
    
    if (!bundlesContainer) return;
    
    // Show loading state
    bundlesContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
        '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6; margin-bottom: 1rem;"></i>' +
        '<h3>Loading Bundles...</h3>' +
        '<p>Please wait while we fetch the latest packages</p>' +
        '</div>';
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        // Fetch bundles from Supabase
        var { data, error } = await supabaseClient
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
            bundlesContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">' +
                '<i class="fas fa-box-open" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>' +
                '<h3>No Bundles Available</h3>' +
                '<p>Please check back later for our internet packages</p>' +
                '</div>';
            return;
        }
        
        // Display bundles from Supabase
        for (var i = 0; i < data.length; i++) {
            var bundle = data[i];
            bundlesContainer.appendChild(createBundleCard(bundle, bundle.id));
        }
        
    } catch (error) {
        console.error('Error loading bundles:', error);
        bundlesContainer.innerHTML = '<div class="no-bundles" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
            '<h3>Unable to Load Bundles</h3>' +
            '<p>' + (error.message || 'Please try again later') + '</p>' +
            '<button onclick="loadBundles()" class="btn btn-secondary" style="margin-top: 1rem;">' +
            '<i class="fas fa-redo"></i> Retry' +
            '</button>' +
            '</div>';
    }
}

function createBundleCard(bundle, key) {
    var bundleCard = document.createElement('div');
    bundleCard.className = 'bundle-card';
    if (bundle.featured) {
        bundleCard.className += ' featured';
    }
    
    // Handle features
    var featuresList = '';
    if (bundle.features) {
        if (Array.isArray(bundle.features)) {
            for (var i = 0; i < bundle.features.length; i++) {
                featuresList += '<li><i class="fas fa-check"></i> ' + bundle.features[i] + '</li>';
            }
        } else if (typeof bundle.features === 'string') {
            var featuresArray = bundle.features.split(',').map(function(f) { return f.trim(); });
            for (var i = 0; i < featuresArray.length; i++) {
                featuresList += '<li><i class="fas fa-check"></i> ' + featuresArray[i] + '</li>';
            }
        }
    }
    
    bundleCard.innerHTML = '<h3>' + (bundle.name || 'Bundle') + '</h3>' +
        '<div class="price">KSh ' + (bundle.price || '0') + '</div>' +
        '<ul>' + featuresList + '</ul>' +
        '<button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="selectBundle(\'' + key + '\')">' +
        '<i class="fas fa-shopping-cart"></i> Select Package' +
        '</button>';
    
    return bundleCard;
}

// Load gallery preview from Supabase
async function loadGalleryPreview() {
    var previewContainer = document.getElementById('gallery-preview-container');
    
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '<div class="loading-gallery">' +
        '<div class="loading-item"></div>' +
        '<div class="loading-item"></div>' +
        '<div class="loading-item"></div>' +
        '</div>';
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        var { data, error } = await supabaseClient
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
            previewContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
                '<i class="fas fa-images" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>' +
                '<h3>No Gallery Items Yet</h3>' +
                '<p>Check back soon for project images</p>' +
                '</div>';
            return;
        }
        
        // Load each gallery item
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var element = await createGalleryPreviewItem(item, item.id);
            previewContainer.appendChild(element);
        }
        
    } catch (error) {
        console.error('Error loading gallery preview:', error);
        previewContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
            '<h3>Unable to Load Gallery</h3>' +
            '<p>' + (error.message || 'Please try again later') + '</p>' +
            '<button onclick="loadGalleryPreview()" class="btn btn-secondary" style="margin-top: 1rem;">' +
            '<i class="fas fa-redo"></i> Retry' +
            '</button>' +
            '</div>';
    }
}

function createGalleryPreviewItem(item, key) {
    return new Promise(function(resolve) {
        var galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-preview-item';
        
        var imageUrl = item.image_url || item.url;
        var img = document.createElement('img');
        img.alt = item.title || 'Project Image';
        img.loading = 'lazy';
        
        // Handle image load error
        img.onerror = function() {
            console.warn('Failed to load image:', imageUrl);
            this.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
            this.onerror = null;
            resolve(galleryItem);
        };
        
        img.onload = function() {
            resolve(galleryItem);
        };
        
        img.src = imageUrl;
        
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 1rem;';
        
        var description = '';
        if (item.description) {
            description = item.description.substring(0, 100);
            if (item.description.length > 100) {
                description += '...';
            }
        }
        
        overlay.innerHTML = '<h4 style="margin: 0; font-size: 1rem;">' + (item.title || 'Project') + '</h4>' +
            '<p style="margin: 0.5rem 0 0; font-size: 0.875rem; opacity: 0.9;">' + description + '</p>';
        
        galleryItem.appendChild(img);
        galleryItem.appendChild(overlay);
        
        // Resolve immediately if image already loaded or failed
        if (img.complete) {
            resolve(galleryItem);
        }
    });
}

// Load full gallery for modal from Supabase
async function loadFullGallery() {
    var modalContainer = document.getElementById('modalGalleryContainer');
    
    if (!modalContainer) return;
    
    modalContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">' +
        '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>' +
        '<p>Loading gallery images...</p>' +
        '</div>';
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        var { data, error } = await supabaseClient
            .from('gallery')
            .select('id, title, description, category, image_url, visible')
            .eq('visible', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        modalContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            modalContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">' +
                '<i class="fas fa-images" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>' +
                '<h3>No Gallery Items Available</h3>' +
                '<p>Check back soon for project images</p>' +
                '</div>';
            return;
        }
        
        // Load all gallery items
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var element = await createModalGalleryItem(item, 'full-' + item.id + '-' + i);
            modalContainer.appendChild(element);
        }
        
        setupGalleryFilters();
        
    } catch (error) {
        console.error('Error loading full gallery:', error);
        modalContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
            '<h3>Unable to Load Gallery</h3>' +
            '<p>' + (error.message || 'Please try again later') + '</p>' +
            '<button onclick="loadFullGallery()" class="btn btn-secondary" style="margin-top: 1rem;">' +
            '<i class="fas fa-redo"></i> Retry' +
            '</button>' +
            '</div>';
    }
}

function createModalGalleryItem(item, key) {
    return new Promise(function(resolve) {
        var galleryItem = document.createElement('div');
        galleryItem.className = 'modal-gallery-item';
        galleryItem.dataset.filter = item.category || 'all';
        
        var imageUrl = item.image_url || item.url;
        var img = document.createElement('img');
        img.alt = item.title || 'Project Image';
        img.loading = 'lazy';
        img.dataset.fullSrc = imageUrl;
        
        // Handle image load error
        img.onerror = function() {
            console.warn('Failed to load image:', imageUrl);
            this.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
            this.onerror = null;
            resolve(galleryItem);
        };
        
        img.onload = function() {
            resolve(galleryItem);
        };
        
        img.src = imageUrl;
        
        galleryItem.appendChild(img);
        
        galleryItem.addEventListener('click', function() {
            showFullImage(imageUrl, item.title || 'Project Image');
        });
        
        // Resolve immediately if image already loaded or failed
        if (img.complete) {
            resolve(galleryItem);
        }
    });
}

// Function to show full-size image in modal
function showFullImage(imageUrl, title) {
    var fullImageModal = document.getElementById('fullImageModal');
    if (!fullImageModal) {
        fullImageModal = document.createElement('div');
        fullImageModal.id = 'fullImageModal';
        fullImageModal.className = 'full-image-modal';
        fullImageModal.innerHTML = '<div class="full-image-container">' +
            '<button class="full-image-close" id="fullImageClose">' +
            '<i class="fas fa-times"></i>' +
            '</button>' +
            '<img id="fullImage" src="" alt="" style="max-width: 90%; max-height: 90%; object-fit: contain;">' +
            '</div>';
        document.body.appendChild(fullImageModal);
        
        document.getElementById('fullImageClose').addEventListener('click', closeFullImage);
        fullImageModal.addEventListener('click', function(e) {
            if (e.target === fullImageModal) {
                closeFullImage();
            }
        });
    }
    
    var fullImage = document.getElementById('fullImage');
    fullImage.src = imageUrl;
    fullImage.alt = title;
    
    // Handle error in full image modal
    fullImage.onerror = function() {
        this.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
    };
    
    fullImageModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Function to close full image modal
function closeFullImage() {
    var fullImageModal = document.getElementById('fullImageModal');
    if (fullImageModal) {
        fullImageModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function setupGalleryFilters() {
    var filterButtons = document.querySelectorAll('.filter-btn');
    
    for (var i = 0; i < filterButtons.length; i++) {
        var button = filterButtons[i];
        button.addEventListener('click', function(e) {
            var filter = e.target.dataset.filter;
            
            for (var j = 0; j < filterButtons.length; j++) {
                filterButtons[j].classList.remove('active');
            }
            e.target.classList.add('active');
            
            filterGalleryItems(filter);
        });
    }
}

function filterGalleryItems(filter) {
    var galleryItems = document.querySelectorAll('.modal-gallery-item');
    
    for (var i = 0; i < galleryItems.length; i++) {
        var item = galleryItems[i];
        var itemFilter = item.dataset.filter || 'all';
        
        if (filter === 'all' || itemFilter === filter) {
            item.style.display = 'block';
            setTimeout(function() {
                item.style.opacity = '1';
            }, 100);
        } else {
            item.style.opacity = '0';
            setTimeout(function() {
                item.style.display = 'none';
            }, 300);
        }
    }
}

// Bundle selection
function selectBundle(bundleId) {
    alert('Thank you for selecting bundle ' + bundleId + '! Our sales team will contact you shortly.');
    openWhatsApp();
}

// WhatsApp contact function
function openWhatsApp() {
    var phoneNumber = '254740851330';
    var message = 'Hello! I am interested in your WiFi bundles. Please contact me.';
    var whatsappUrl = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
    window.open(whatsappUrl, '_blank');
}

// NOTIFICATIONS FUNCTIONS - Using timestamp-based tracking instead of read_by column
async function loadNotifications() {
    var container = document.getElementById('messagesContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading notifications...</div>';
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        // Fetch notifications from Supabase - removed read_by column
        var { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('sent', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        window.notifications = data || [];
        displayNotifications(window.notifications);
        updateNotificationsBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<div class="no-messages">' +
            '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
            '<h3>Error Loading Notifications</h3>' +
            '<p>' + (error.message || 'Please try again later') + '</p>' +
            '<button onclick="loadNotifications()" class="btn btn-secondary" style="margin-top: 1rem;">' +
            '<i class="fas fa-redo"></i> Retry' +
            '</button>' +
            '</div>';
    }
}

function displayNotifications(notificationsList) {
    var container = document.getElementById('messagesContainer');
    
    if (!container) return;
    
    if (!notificationsList || notificationsList.length === 0) {
        container.innerHTML = '<div class="no-messages">' +
            '<i class="fas fa-bell-slash" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>' +
            '<p>No notifications yet</p>' +
            '</div>';
        return;
    }
    
    var lastView = localStorage.getItem('lastNotificationsView');
    var html = '';
    
    for (var i = 0; i < notificationsList.length; i++) {
        var notification = notificationsList[i];
        var time = new Date(notification.created_at).toLocaleString();
        
        // Check if this notification is new (created after last view)
        var isNew = false;
        if (lastView) {
            isNew = new Date(notification.created_at) > new Date(lastView);
        } else {
            isNew = true; // If no last view, all are new
        }
        
        html += '<div class="message-item' + (isNew ? ' unread' : '') + '" data-id="' + notification.id + '" onclick="markNotificationAsRead(\'' + notification.id + '\')">' +
            '<div class="message-header">' +
            '<div class="message-sender">' +
            '<i class="fas fa-bullhorn" style="color: #3b82f6; margin-right: 0.5rem;"></i>' +
            'Admin Update' +
            '</div>' +
            '<div class="message-time">' + time + '</div>' +
            '</div>';
        
        if (notification.title) {
            html += '<div style="font-weight: bold; margin: 0.5rem 0; color: #333;">' + notification.title + '</div>';
        }
        
        html += '<div class="message-content">' + (notification.message || notification.content || '') + '</div>' +
            '</div>';
    }
    
    container.innerHTML = html;
}

function markNotificationAsRead(notificationId) {
    // For timestamp-based tracking, we don't need to update the database
    // Just update the UI and the last view time will handle it
    var item = document.querySelector('.message-item[data-id="' + notificationId + '"]');
    if (item) {
        item.classList.remove('unread');
    }
    
    // Update badge count
    updateNotificationsBadge();
}

async function markAllNotificationsAsRead() {
    // Update last view time to now
    localStorage.setItem('lastNotificationsView', new Date().toISOString());
    
    // Remove unread class from all items
    var items = document.querySelectorAll('.message-item');
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('unread');
    }
    
    // Update badge
    updateNotificationsBadge();
    showNotification('All notifications marked as read', 'success');
}

async function updateNotificationsBadge() {
    try {
        if (!supabaseClient) return;
        
        // Get last view time
        var lastView = localStorage.getItem('lastNotificationsView');
        
        // Build query
        var query = supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('sent', true);
        
        // If we have a last view time, get only newer notifications
        if (lastView) {
            query = query.gt('created_at', lastView);
        }
        
        var { count, error } = await query;
        
        if (error) {
            console.error('Error counting notifications:', error);
            return;
        }
        
        var badge = document.getElementById('message-count');
        if (!badge) return;
        
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

function openNotificationsModal() {
    console.log('Opening notifications modal');
    var modal = document.getElementById('messagesModal');
    var modalTitle = document.getElementById('messagesModalTitle');
    
    if (modal) {
        // Update modal title
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-bell"></i> Notifications & Updates';
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadNotifications();
    } else {
        console.error('Messages modal not found');
    }
}

function closeMessagesModal() {
    var modal = document.getElementById('messagesModal');
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

function exportNotifications() {
    var notifications = window.notifications || [];
    
    if (notifications.length === 0) {
        showNotification('No notifications to export', 'warning');
        return;
    }
    
    // Convert notifications to CSV
    var headers = ['Title', 'Message', 'Date'];
    var csvRows = [
        headers.join(','),
        ...notifications.map(function(notification) {
            return [
                '"' + (notification.title || '') + '"',
                '"' + (notification.message || notification.content || '') + '"',
                '"' + new Date(notification.created_at).toLocaleString() + '"'
            ].join(',');
        })
    ];
    
    var csvContent = csvRows.join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'notifications_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Notifications exported successfully', 'success');
}

// Contact action functions
function callNow() {
    var phoneNumber = '0740851330';
    if (confirm('Call ' + phoneNumber + '?')) {
        window.location.href = 'tel:' + phoneNumber;
    }
}

function sendEmail() {
    var email = 'support@starlinktokenwifi.com';
    var subject = 'Inquiry about Starlink Token WiFi Services';
    var body = 'Hello Starlink Token WiFi,\n\nI would like to inquire about your services.\n\nBest regards,';
    var mailtoUrl = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = mailtoUrl;
}

function openLocation() {
    var address = 'Nakuru, Kenya';
    var mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
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
window.exportNotifications = exportNotifications;
window.callNow = callNow;
window.sendEmail = sendEmail;
window.openLocation = openLocation;
window.openFacebook = openFacebook;
window.openTwitter = openTwitter;
window.openInstagram = openInstagram;
window.markNotificationAsRead = markNotificationAsRead;
window.updateNotificationsBadge = updateNotificationsBadge;

console.log('Browser-compatible main script initialized');
