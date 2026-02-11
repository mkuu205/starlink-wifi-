
// Firebase import removed - using Formspree for contact form
// Supabase configuration
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Global Functions for Bundle and Gallery Controls
function showBundles() {
    const bundlesSection = document.getElementById('bundles');
    bundlesSection.style.display = 'block';
    bundlesSection.scrollIntoView({ behavior: 'smooth' });
    
    // Load bundles if not already loaded
    if (!document.querySelector('.bundle-card')) {
        loadBundles();
    }
}

function hideBundles() {
    document.getElementById('bundles').style.display = 'none';
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
}

function openGalleryModal() {
    document.getElementById('galleryModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Load full gallery if not already loaded
    if (!document.querySelector('.modal-gallery-item')) {
        loadFullGallery();
    }
}

function closeGalleryModal() {
    document.getElementById('galleryModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Initialize main functionality
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu) {
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

    // Load bundles and gallery preview
    loadBundles();
    loadGalleryPreview();
});

// Load bundles from database
async function loadBundles() {
    const bundlesContainer = document.getElementById('bundles-container');
    
    if (bundlesContainer) {
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
        <div class="loading-spinner" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6;"></i>
            <p>Loading gallery...</p>
        </div>
    `;
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
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
                <div class="no-gallery" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
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
            <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Unable to Load Gallery</h3>
                <p>Please try again later</p>
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
        <div class="loading-spinner" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>
            <p>Loading gallery images...</p>
        </div>
    `;
    
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
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
                <div class="no-gallery" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
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
            <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Unable to Load Gallery</h3>
                <p>Please try again later</p>
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
        <img src="${imageUrl}" alt="${item.title || 'Project Image'}" loading="lazy">
    `;
    
    return galleryItem;
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
    
    const selections = JSON.parse(localStorage.getItem('bundle_selections') || '[]');
    selections.push({
        bundleId: bundleId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
    });
    localStorage.setItem('bundle_selections', JSON.stringify(selections));
    
    openWhatsApp();
}

// WhatsApp contact function
function openWhatsApp() {
    const phoneNumber = '254XXXXXXXXX'; // Replace with your WhatsApp number
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
window.openWhatsApp = openWhatsApp;
