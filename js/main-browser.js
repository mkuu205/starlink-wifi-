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

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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
        setInterval(checkForUpdates, 30000); // Check every 30 seconds
    }
    
    // Set up contact form and message notification
    setupContactForm();
    setupMessageNotification();
    updateMessageCount();
    
    // Update message count periodically
    setInterval(updateMessageCount, 60000); // Update every minute
});

// Function to check for admin updates
async function checkForUpdates() {
    try {
        // Check localStorage for updates first
        const updates = JSON.parse(localStorage.getItem('site_updates') || '[]');
        if (updates.length > 0) {
            const latestUpdate = updates[updates.length - 1];
            showNotification(latestUpdate.title || 'Site Update', latestUpdate.content);
            // Clear the update after showing
            localStorage.setItem('site_updates', JSON.stringify([]));
        }
        
        // Also check backend if available
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
                
                // Mark as read/delivered
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
        
        // Auto-hide after 5 seconds
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
            
            try {
                // Check if we have supabase client
                if (!supabaseClient) {
                    // Fallback to localStorage if no Supabase
                    const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
                    messages.push({
                        id: Date.now(),
                        name,
                        email,
                        phone,
                        service,
                        message,
                        read: false,
                        created_at: new Date().toISOString()
                    });
                    localStorage.setItem('contact_messages', JSON.stringify(messages));
                    
                    formMessage.innerHTML = '<p class="success">Message saved locally! We\'ll contact you soon.</p>';
                    formMessage.style.color = 'green';
                    form.reset();
                    
                    // Update message count
                    updateMessageCount();
                    
                    // Auto-hide message after 5 seconds
                    setTimeout(() => {
                        formMessage.innerHTML = '';
                    }, 5000);
                    return;
                }
                
                // Send to Supabase
                const { error } = await supabaseClient
                    .from('messages')
                    .insert([{
                        name: name,
                        email: email,
                        phone: phone,
                        service: service,
                        message: message,
                        read: false,
                        created_at: new Date().toISOString()
                    }]);
                
                if (error) throw error;
                
                formMessage.innerHTML = '<p class="success">Message sent successfully! We\'ll contact you soon.</p>';
                formMessage.style.color = 'green';
                form.reset();
                
                // Update message count
                updateMessageCount();
                
                // Auto-hide message after 5 seconds
                setTimeout(() => {
                    formMessage.innerHTML = '';
                }, 5000);
                
            } catch (error) {
                console.error('Error sending message:', error);
                formMessage.innerHTML = '<p class="error">Error sending message. Please try again.</p>';
                formMessage.style.color = 'red';
            }
        });
    }
}

// Setup message notification button
function setupMessageNotification() {
    const messageButton = document.getElementById('messages-notification');
    if (messageButton) {
        // Remove old click handler if exists
        messageButton.removeEventListener('click', handleMessageClick);
        
        // Add new click handler
        messageButton.addEventListener('click', handleMessageClick);
    }
}

function handleMessageClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if messages modal function exists
    if (typeof window.openMessagesModal === 'function') {
        window.openMessagesModal();
    } else {
        // Fallback to scrolling to contact section
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Update message count badge
async function updateMessageCount() {
    try {
        let unreadCount = 0;
        
        if (supabaseClient) {
            // Try to get count from Supabase
            const { count, error } = await supabaseClient
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('read', false);
            
            if (!error && count !== null) {
                unreadCount = count;
            }
        } else {
            // Fallback to localStorage
            const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
            unreadCount = messages.filter(msg => !msg.read).length;
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
    
    // Show loading state
    previewContainer.innerHTML = `
        <div class="loading-gallery">
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
        </div>
    `;
    
    try {
        // Check if Supabase client is available
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized. Please refresh the page.');
        }
        
        // Fetch gallery items from Supabase
        const { data, error } = await supabaseClient
            .from('gallery')
            .select('id, title, description, category, image_url, visible')
            .eq('visible', true)
            .order('timestamp', { ascending: false })
            .limit(3);
        
        if (error) {
            throw error;
        }
        
        // Clear container
        previewContainer.innerHTML = '';
        
        // If no data, show message
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
        
        // Create gallery items
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
    
    // Use image_url if available, otherwise fall back to url
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
    
    // Show loading state
    modalContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>
            <p>Loading gallery images...</p>
        </div>
    `;
    
    try {
        // Check if Supabase client is available
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized. Please refresh the page.');
        }
        
        // Fetch all visible gallery items from Supabase
        const { data, error } = await supabaseClient
            .from('gallery')
            .select('id, title, description, category, image_url, visible')
            .eq('visible', true)
            .order('timestamp', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // Clear container
        modalContainer.innerHTML = '';
        
        // If no data, show message
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
        
        // Create gallery items
        data.forEach((item, index) => {
            modalContainer.appendChild(createModalGalleryItem(item, `full-${item.id}-${index}`));
        });
        
        // Setup filter functionality
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
    
    // Use image_url if available, otherwise fall back to url
    const imageUrl = item.image_url || item.url;
    
    galleryItem.innerHTML = `
        <img src="${imageUrl}" alt="${item.title || 'Project Image'}" loading="lazy" data-full-src="${imageUrl}">
    `;
    
    // Add click event to show full image
    galleryItem.addEventListener('click', () => {
        showFullImage(imageUrl, item.title || 'Project Image');
    });
    
    return galleryItem;
}

// Function to show full-size image in modal
function showFullImage(imageUrl, title) {
    // Create full image modal if it doesn't exist
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
        
        // Add event listeners
        document.getElementById('fullImageClose').addEventListener('click', closeFullImage);
        fullImageModal.addEventListener('click', (e) => {
            if (e.target === fullImageModal) {
                closeFullImage();
            }
        });
    }
    
    // Set image source and show modal
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
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filter gallery items
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
    
    // Open WhatsApp for immediate contact
    openWhatsApp();
}

// WhatsApp contact function
function openWhatsApp() {
    const phoneNumber = '254740851330';
    const message = 'Hello! I am interested in your WiFi bundles. Please contact me.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

console.log('Browser-compatible main script initialized');
