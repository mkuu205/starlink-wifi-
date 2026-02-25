// Firebase import removed - using Formspree for contact form
// Supabase configuration
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpcCI6InN1cGFiYXNlIiwicmVmIjoiamdhZWxkZ3V3ZXpiZ2dsd2FpdnaiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3MDU3ODU1MCwiZXhwIjoyMDg2MTU0NTUwfQ.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ';

// Initialize Supabase client
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Global Functions for Bundle and Gallery Controls
function showBundles() {
    const bundlesSection = document.getElementById('bundles');
    bundlesSection.style.display = 'block';
    bundlesSection.scrollIntoView({ behavior: 'smooth' });
    if (!document.querySelector('.bundle-card')) loadBundles();
}

function hideBundles() {
    document.getElementById('bundles').style.display = 'none';
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
}

function openGalleryModal() {
    document.getElementById('galleryModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    if (!document.querySelector('.modal-gallery-item')) loadFullGallery();
}

function closeGalleryModal() {
    document.getElementById('galleryModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Initialize main functionality
document.addEventListener('DOMContentLoaded', () => {
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

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#') && this.getAttribute('href') !== '#') {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    loadBundles();
    loadGalleryPreview();
});

// ===================== BUNDLES FROM SUPABASE =====================
async function loadBundles() {
    const bundlesContainer = document.getElementById('bundles-container');
    if (!bundlesContainer) return;

    bundlesContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading bundles...</p>
        </div>`;

    try {
        if (!supabaseClient) throw new Error('Supabase not initialized');

        const { data, error } = await supabaseClient
            .from('bundles')
            .select('*')
            .eq('visible', true)
            .order('price', { ascending: true });

        if (error) throw error;
        bundlesContainer.innerHTML = '';

        if (!data || data.length === 0) {
            bundlesContainer.innerHTML = `
                <div class="no-bundles" style="grid-column:1/-1;text-align:center;padding:3rem">
                    <i class="fas fa-box-open" style="font-size:3rem;color:#9ca3af;margin-bottom:1rem"></i>
                    <h3>No bundles available</h3>
                </div>`;
            return;
        }

        data.forEach(bundle => bundlesContainer.appendChild(createBundleCard(bundle, bundle.bundle_id)));
    } catch (err) {
        console.error('Bundles load error:', err);
        bundlesContainer.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:#ef4444"></i>
                <h3>Unable to load bundles</h3>
            </div>`;
    }
}

function createBundleCard(bundle, key) {
    const bundleCard = document.createElement('div');
    bundleCard.className = `bundle-card ${bundle.featured ? 'featured' : ''}`;

    const featuresList = (bundle.features || [])
        .map(f => `<li><i class="fas fa-check"></i> ${f}</li>`)
        .join('');

    bundleCard.innerHTML = `
        <h3>${bundle.name}</h3>
        <div class="price">KSh ${bundle.price}</div>
        <ul>${featuresList}</ul>
        <button class="btn btn-primary" style="width:100%;margin-top:1rem" onclick="selectBundle('${key}')">
            <i class="fas fa-shopping-cart"></i> Select Package
        </button>`;

    return bundleCard;
}

// ===================== GALLERY =====================
async function loadGalleryPreview() {
    const previewContainer = document.getElementById('gallery-preview-container');
    if (!previewContainer) return;

    previewContainer.innerHTML = `<div style="text-align:center;padding:2rem"><i class="fas fa-spinner fa-spin"></i><p>Loading gallery...</p></div>`;

    try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { data, error } = await supabaseClient
            .from('gallery')
            .select('id,title,description,category,image_url,visible,created_at')
            .eq('visible', true)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;
        previewContainer.innerHTML = '';
        if (!data || data.length === 0) return previewContainer.innerHTML = '<p>No images yet</p>';

        data.forEach(item => previewContainer.appendChild(createGalleryPreviewItem(item)));
    } catch (error) {
        console.error('Error loading gallery preview:', error);
        previewContainer.innerHTML = '<p>Unable to load gallery</p>';
    }
}

function createGalleryPreviewItem(item) {
    const el = document.createElement('div');
    el.className = 'gallery-preview-item';
    el.innerHTML = `<img src="${item.image_url}" alt="${item.title || 'Image'}" loading="lazy">`;
    return el;
}

async function loadFullGallery() {
    const modalContainer = document.getElementById('modalGalleryContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = '<div style="text-align:center;padding:3rem"><i class="fas fa-spinner fa-spin"></i></div>';

    try {
        const { data, error } = await supabaseClient
            .from('gallery')
            .select('*')
            .eq('visible', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        modalContainer.innerHTML = '';
        data.forEach(item => modalContainer.appendChild(createModalGalleryItem(item)));
    } catch (error) {
        console.error('Full gallery error:', error);
        modalContainer.innerHTML = '<p>Unable to load gallery</p>';
    }
}

function createModalGalleryItem(item) {
    const el = document.createElement('div');
    el.className = 'modal-gallery-item';
    el.dataset.filter = item.category || 'all';
    el.innerHTML = `<img src="${item.image_url}" alt="${item.title || 'Image'}" loading="lazy">`;
    return el;
}

// Bundle selection
function selectBundle(bundleId) {
    alert(`Thank you for selecting bundle ${bundleId}! Our sales team will contact you shortly.`);
    const selections = JSON.parse(localStorage.getItem('bundle_selections') || '[]');
    selections.push({ bundleId, timestamp: Date.now(), userAgent: navigator.userAgent });
    localStorage.setItem('bundle_selections', JSON.stringify(selections));
    openWhatsApp();
}

function openWhatsApp() {
    const phoneNumber = '254XXXXXXXXX';
    const message = 'Hello! I am interested in your WiFi bundles. Please contact me.';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

window.showBundles = showBundles;
window.hideBundles = hideBundles;
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.selectBundle = selectBundle;
window.openWhatsApp = openWhatsApp;
