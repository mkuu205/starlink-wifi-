// main-browser.js - Complete Main Website Script with Notification System
// Email: support@starlinktokenwifi.com (forwards to billnjehia18@gmail.com)

// Supabase Configuration
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ';

// Global Variables
let supabaseClient = null;
let messaging = null;
let fcmToken = null;
let notificationSystem = null;
let currentGalleryItems = [];

// ==================== SUPABASE INITIALIZATION ====================

// Initialize Supabase
function initializeSupabase() {
  if (window.supabase && window.supabase.createClient) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return false;
    }
  }
  return false;
}

// ==================== NOTIFICATION SYSTEM ====================

// Notification System Class
class NotificationSystem {
  constructor() {
    this.supabase = supabaseClient;
    this.pollInterval = 30000;
    this.lastCheck = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString();
    this.notifications = [];
    this.unreadCount = 0;
    this.backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'https://starlink-wifi-backend-v862.onrender.com';
    this.init();
  }
  
  init() {
    this.setupNotificationCenter();
    this.startPolling();
    this.setupToast();
    this.loadNotifications();
  }
  
  setupToast() {
    if (!document.getElementById('notification-toast')) {
      const toast = document.createElement('div');
      toast.id = 'notification-toast';
      toast.className = 'notification-toast';
      toast.innerHTML = `
        <div class="notification-content">
          <i class="fas fa-info-circle"></i>
          <span id="notification-message"></span>
          <button class="notification-close" onclick="closeNotification()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      document.body.appendChild(toast);
    }
  }
  
  startPolling() {
    this.checkForNewNotifications();
    setInterval(() => this.checkForNewNotifications(), this.pollInterval);
  }
  
  async checkForNewNotifications() {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/notifications?since=${encodeURIComponent(this.lastCheck)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const data = result.notifications || [];
      
      if (data && data.length > 0) {
        this.notifications = [...data, ...this.notifications];
        
        data.slice(0, 3).forEach(notification => {
          this.showNotificationToast(
            notification.title || 'New Update',
            notification.message || notification.content || ''
          );
        });
        
        this.updateNotificationCenter();
        this.lastCheck = data[0].created_at;
      } else {
        this.lastCheck = new Date().toISOString();
      }
      
      localStorage.setItem('lastNotificationCheck', this.lastCheck);
      
    } catch (error) {
      console.error('Error checking notifications:', error);
      this.lastCheck = new Date().toISOString();
      localStorage.setItem('lastNotificationCheck', this.lastCheck);
    }
  }
  
  showNotificationToast(title, message) {
    const toast = document.getElementById('notification-toast');
    const messageSpan = document.getElementById('notification-message');
    
    if (toast && messageSpan) {
      messageSpan.textContent = `${title}: ${message}`;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 8000);
    }
  }
  
  setupNotificationCenter() {
    const markAllBtn = document.querySelector('.mark-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => this.markAllAsRead());
    }
    
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshNotifications());
    }
    
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportNotifications());
    }
  }
  
  async loadNotifications() {
    try {
      const container = document.getElementById('messagesContainer');
      if (!container) return;
      
      container.innerHTML = '<div class="no-messages"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i><p>Loading notifications...</p></div>';
      
      const response = await fetch(`${this.backendUrl}/api/notifications?limit=50`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      this.notifications = result.notifications || [];
      this.updateNotificationCenter();
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      const container = document.getElementById('messagesContainer');
      if (container) {
        container.innerHTML = '<div class="no-messages"><i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i><p>Failed to load notifications</p></div>';
      }
    }
  }
  
  updateNotificationCenter() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    if (!this.notifications || this.notifications.length === 0) {
      container.innerHTML = `
        <div class="no-messages">
          <i class="fas fa-bell-slash" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
          <p>No notifications yet</p>
        </div>
      `;
      this.updateBadge();
      return;
    }
    
    let html = '';
    const lastView = localStorage.getItem('lastNotificationsView');
    
    this.notifications.forEach(notification => {
      const isUnread = !lastView || new Date(notification.created_at) > new Date(lastView);
      const timeAgo = this.timeAgo(new Date(notification.created_at));
      
      html += `
        <div class="message-item ${isUnread ? 'unread' : ''}">
          <div class="message-header">
            <span class="message-sender">${notification.title || 'System Update'}</span>
            <span class="message-time">${timeAgo}</span>
          </div>
          <div class="message-content">
            ${notification.message || notification.content || ''}
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    this.updateBadge();
  }
  
  timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  }
  
  markAllAsRead() {
    localStorage.setItem('lastNotificationsView', new Date().toISOString());
    this.updateNotificationCenter();
    this.showNotificationToast('Notifications', 'All marked as read');
  }
  
  async refreshNotifications() {
    await this.loadNotifications();
    this.showNotificationToast('Refreshed', 'Notifications updated');
  }
  
  exportNotifications() {
    if (this.notifications.length === 0) {
      this.showNotificationToast('No notifications', 'Nothing to export');
      return;
    }
    
    const data = this.notifications.map(n => ({
      title: n.title,
      message: n.message || n.content,
      priority: n.priority,
      date: new Date(n.created_at).toLocaleString()
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotificationToast('Exported', `${data.length} notifications exported`);
  }
  
  updateBadge() {
    const badge = document.getElementById('message-count');
    if (!badge) return;
    
    const lastView = localStorage.getItem('lastNotificationsView');
    const unread = this.notifications.filter(n => {
      return !lastView || new Date(n.created_at) > new Date(lastView);
    }).length;
    
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  openNotificationCenter() {
    const modal = document.querySelector('.messages-modal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      this.loadNotifications();
    }
  }
  
  closeNotificationCenter() {
    const modal = document.querySelector('.messages-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
}

// ==================== FIREBASE MESSAGING ====================

async function initializeMessaging() {
  if (typeof firebase === 'undefined') {
    return false;
  }
  
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    const firebaseConfig = {
      apiKey: "AIzaSyAtt28zOdzpr_CraaSFHzvIOcwggqMYuvE",
      authDomain: "starlink-token-wifi.firebaseapp.com",
      projectId: "starlink-token-wifi",
      storageBucket: "starlink-token-wifi.firebasestorage.app",
      messagingSenderId: "61255418270",
      appId: "1:61255418270:web:920ad2fa18a7e378e0168f"
    };
    
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    messaging = firebase.messaging();
    
    await requestNotificationPermission();
    
    messaging.onMessage((payload) => {
      if (notificationSystem) {
        notificationSystem.showNotificationToast(
          payload.notification?.title || 'New Update',
          payload.notification?.body || 'You have a new notification'
        );
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return false;
  }
}

async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const vapidKey = 'BL2-1Ej72YPhk-TH1tExzaWd3eiUL_nzL2MMNwr8F9n1Nz3SxgOD88XOgoFIZIRTrsh1i9iXw_hsBYxEKffT7hY';
      
      try {
        fcmToken = await messaging.getToken({ vapidKey: vapidKey });
        await saveFCMToken(fcmToken);
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
      }
    }
  } catch (error) {
    console.error('Error requesting permission:', error);
  }
}

async function saveFCMToken(token) {
  try {
    if (!supabaseClient) return;
    
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    
    const backendUrl = (window.location.hostname === 'localhost')
      ? 'http://localhost:3000'
      : 'https://starlink-wifi-backend-v862.onrender.com';
    
    await fetch(`${backendUrl}/api/save-fcm-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        deviceId: deviceId,
        platform: 'web',
        userAgent: navigator.userAgent
      })
    });
    
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}

// ==================== GALLERY FUNCTIONS ====================

// Load Gallery Preview (for homepage)
async function loadGalleryPreview() {
  const container = document.getElementById('gallery-preview-container');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-gallery">' +
    '<div class="loading-item"></div><div class="loading-item"></div><div class="loading-item"></div></div>';
  
  try {
    if (!supabaseClient) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseClient
      .from('gallery')
      .select('id, title, description, category, image_url, visible')
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (error) throw error;
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 3rem; grid-column: 1/-1;">' +
        '<i class="fas fa-images" style="font-size: 3rem; color: #9ca3af;"></i>' +
        '<h3>No Gallery Items Yet</h3></div>';
      return;
    }
    
    data.forEach(item => {
      const galleryItem = createGalleryPreviewItem(item);
      galleryItem.addEventListener('click', () => openImageModal(item));
      container.appendChild(galleryItem);
    });
  } catch (error) {
    console.error('Error loading gallery:', error);
    container.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
      '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>' +
      '<h3>Unable to Load Gallery</h3>' +
      '<button onclick="loadGalleryPreview()" class="btn btn-secondary"><i class="fas fa-redo"></i> Retry</button></div>';
  }
}

// Create Gallery Preview Item
function createGalleryPreviewItem(item) {
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-preview-item';
  galleryItem.style.cssText = 'position: relative; overflow: hidden; border-radius: 8px; cursor: pointer;';
  
  const imageUrl = item.image_url || item.url;
  
  const imgWrapper = document.createElement('div');
  imgWrapper.style.cssText = 'width: 100%; height: 250px; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;';
  
  const img = document.createElement('img');
  img.alt = item.title || 'Project Image';
  img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: cover; width: 100%; height: 100%;';
  img.loading = 'lazy';
  
  img.onerror = function() {
    this.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%;';
    placeholder.innerHTML = `
      <i class="fas fa-wifi" style="font-size: 3rem; color: #3b82f6; margin-bottom: 10px;"></i>
      <span style="color: #6b7280; font-size: 0.9rem;">${item.title || 'Installation'}</span>
    `;
    imgWrapper.appendChild(placeholder);
  };
  
  if (imageUrl && imageUrl.trim() !== '') {
    img.src = imageUrl;
  } else {
    img.onerror();
  }
  
  imgWrapper.appendChild(img);
  galleryItem.appendChild(imgWrapper);
  
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 1rem;';
  
  let description = '';
  if (item.description) {
    description = item.description.substring(0, 100);
    if (item.description.length > 100) description += '...';
  }
  
  overlay.innerHTML = 
    '<h4 style="margin: 0; font-size: 1rem;">' + (item.title || 'Project') + '</h4>' +
    '<p style="margin: 0.5rem 0 0; font-size: 0.875rem; opacity: 0.9;">' + description + '</p>';
  
  galleryItem.appendChild(overlay);
  
  return galleryItem;
}

// Load Full Gallery for Modal
async function loadFullGallery(filter = 'all') {
  const container = document.getElementById('modalGalleryContainer');
  if (!container) {
    console.error('Modal gallery container not found');
    return;
  }
  
  container.innerHTML = '<div style="text-align: center; padding: 3rem; grid-column: 1/-1;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>' +
    '<h3>Loading Gallery...</h3></div>';
  
  try {
    if (!supabaseClient) throw new Error('Supabase not initialized');
    
    let query = supabaseClient
      .from('gallery')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false });
    
    // Map filter to database category
    let dbFilter = filter;
    if (filter === 'installation') dbFilter = 'Installations';
    if (filter === 'business') dbFilter = 'Business';
    if (filter === 'home') dbFilter = 'Home';
    
    if (filter !== 'all') {
      query = query.eq('category', dbFilter);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    currentGalleryItems = data || [];
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 3rem; grid-column: 1/-1;">' +
        '<i class="fas fa-images" style="font-size: 3rem; color: #9ca3af;"></i>' +
        '<h3>No Gallery Items Found</h3></div>';
      return;
    }
    
    data.forEach(item => {
      const galleryItem = createModalGalleryItem(item);
      container.appendChild(galleryItem);
    });
  } catch (error) {
    console.error('Error loading full gallery:', error);
    container.innerHTML = '<div style="text-align: center; padding: 3rem; grid-column: 1/-1;">' +
      '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>' +
      '<h3>Unable to Load Gallery</h3>' +
      '<button onclick="loadFullGallery()" class="btn btn-secondary"><i class="fas fa-redo"></i> Retry</button></div>';
  }
}

// Create Modal Gallery Item
function createModalGalleryItem(item) {
  const galleryItem = document.createElement('div');
  galleryItem.className = 'modal-gallery-item';
  galleryItem.style.cssText = 'position: relative; overflow: hidden; border-radius: 8px; cursor: pointer; transition: transform 0.3s;';
  
  const imageUrl = item.image_url || item.url;
  
  const img = document.createElement('img');
  img.src = imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';
  img.alt = item.title || 'Gallery Image';
  img.style.cssText = 'width: 100%; height: 200px; object-fit: cover;';
  img.loading = 'lazy';
  
  img.onerror = function() {
    this.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
  };
  
  galleryItem.appendChild(img);
  
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 10px; transform: translateY(100%); transition: transform 0.3s;';
  overlay.innerHTML = `<strong>${item.title || 'Project'}</strong>`;
  
  galleryItem.appendChild(overlay);
  
  galleryItem.addEventListener('mouseenter', () => {
    overlay.style.transform = 'translateY(0)';
  });
  
  galleryItem.addEventListener('mouseleave', () => {
    overlay.style.transform = 'translateY(100%)';
  });
  
  galleryItem.addEventListener('click', () => openImageModal(item));
  
  return galleryItem;
}

// Open Image Modal
function openImageModal(item) {
  // Create image view modal if it doesn't exist
  let modal = document.getElementById('imageViewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageViewModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3 id="imageModalTitle"></h3>
          <button class="modal-close" onclick="closeImageModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" style="text-align: center;">
          <img id="modalImage" src="" alt="" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
          <p id="imageModalDescription" style="margin-top: 1rem;"></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  const titleEl = document.getElementById('imageModalTitle');
  const imageEl = document.getElementById('modalImage');
  const descEl = document.getElementById('imageModalDescription');
  
  if (titleEl) titleEl.textContent = item.title || 'Project Image';
  if (imageEl) {
    imageEl.src = item.image_url || item.url || 'https://via.placeholder.com/800x600?text=No+Image';
    imageEl.alt = item.title || 'Project Image';
  }
  if (descEl) descEl.textContent = item.description || '';
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Close Image Modal
function closeImageModal() {
  const modal = document.getElementById('imageViewModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Open Gallery Modal
function openGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadFullGallery('all');
  }
}

// Close Gallery Modal
function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Setup Gallery Filters
function setupGalleryFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  if (!filterButtons.length) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      const filter = this.getAttribute('data-filter') || 'all';
      loadFullGallery(filter);
    });
  });
}

// ==================== BUNDLES FUNCTIONS ====================

// Load Bundles
async function loadBundles() {
  const container = document.getElementById('bundles-container');
  if (!container) return;
  
  container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>' +
    '<h3>Loading Bundles...</h3></div>';
  
  try {
    if (!supabaseClient) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseClient
      .from('bundles')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">' +
        '<i class="fas fa-box-open" style="font-size: 3rem; color: #9ca3af;"></i>' +
        '<h3>No Bundles Available</h3></div>';
      return;
    }
    
    data.forEach(bundle => container.appendChild(createBundleCard(bundle, bundle.id)));
  } catch (error) {
    console.error('Error loading bundles:', error);
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
      '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>' +
      '<h3>Unable to Load Bundles</h3>' +
      '<button onclick="loadBundles()" class="btn btn-secondary"><i class="fas fa-redo"></i> Retry</button></div>';
  }
}

function createBundleCard(bundle, key) {
  const card = document.createElement('div');
  card.className = 'bundle-card' + (bundle.featured ? ' featured' : '');
  
  let featuresList = '';
  if (bundle.features) {
    const features = Array.isArray(bundle.features) 
      ? bundle.features 
      : bundle.features.split(',').map(f => f.trim());
    features.forEach(f => {
      featuresList += '<li><i class="fas fa-check"></i> ' + f + '</li>';
    });
  }
  
  card.innerHTML = 
    '<h3>' + (bundle.name || 'Bundle') + '</h3>' +
    '<div class="price">KSh ' + (bundle.price || '0') + '</div>' +
    '<ul>' + featuresList + '</ul>' +
    '<button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="selectBundle(\'' + key + '\')">' +
    '<i class="fas fa-shopping-cart"></i> Select Package</button>';
  
  return card;
}

// ==================== CONTACT FORM ====================

function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
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
      const backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://starlink-wifi-backend-v862.onrender.com';
      
      const response = await fetch(backendUrl + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, service, message })
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
      console.error('Error:', error);
      formMessage.innerHTML = '<p class="error">Error sending message. Please call us at 0740 851 330.</p>';
      formMessage.style.color = 'red';
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      setTimeout(() => { formMessage.innerHTML = ''; }, 5000);
    }
  });
}

// ==================== UTILITY FUNCTIONS ====================

function selectBundle(bundleId) {
  alert('Thank you for selecting bundle ' + bundleId + '! Our sales team will contact you shortly.');
  openWhatsApp();
}

function openWhatsApp() {
  const phoneNumber = '254740851330';
  const message = 'Hello! I am interested in your WiFi bundles. Please contact me.';
  window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
}

function showBundles() {
  const section = document.getElementById('bundles');
  if (!section) return;
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });
  if (!document.querySelector('.bundle-card')) loadBundles();
}

function hideBundles() {
  const section = document.getElementById('bundles');
  const home = document.getElementById('home');
  if (section) section.style.display = 'none';
  if (home) home.scrollIntoView({ behavior: 'smooth' });
}

function callNow() {
  if (confirm('Call 0740 851 330?')) {
    window.location.href = 'tel:0740851330';
  }
}

function sendEmail() {
  const email = 'support@starlinktokenwifi.com';
  const subject = 'Inquiry about Starlink Token WiFi Services';
  const body = 'Hello Starlink Token WiFi,\n\nI would like to inquire about your services.\n\nBest regards,';
  window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}

function openLocation() {
  window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Nakuru, Kenya'), '_blank');
}

function openFacebook() { window.open('https://facebook.com', '_blank'); }
function openTwitter() { window.open('https://twitter.com', '_blank'); }
function openInstagram() { window.open('https://instagram.com', '_blank'); }

// Notification functions
function closeNotification() {
  const toast = document.getElementById('notification-toast');
  if (toast) toast.classList.remove('show');
}

function openMessagesModal() {
  if (notificationSystem) {
    notificationSystem.openNotificationCenter();
  }
}

function closeMessagesModal() {
  if (notificationSystem) {
    notificationSystem.closeNotificationCenter();
  }
}

function markAllNotificationsAsRead() {
  if (notificationSystem) {
    notificationSystem.markAllAsRead();
  }
}

function refreshNotifications() {
  if (notificationSystem) {
    notificationSystem.refreshNotifications();
  }
}

function exportNotifications() {
  if (notificationSystem) {
    notificationSystem.exportNotifications();
  }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
  const supabaseInitialized = initializeSupabase();
  
  if (supabaseInitialized) {
    notificationSystem = new NotificationSystem();
    window.notificationSystem = notificationSystem;
  }
  
  setTimeout(() => {
    initializeMessaging();
  }, 1000);
  
  // Mobile Menu Toggle
  const mobileMenu = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      const icon = mobileMenu.querySelector('i');
      if (icon) {
        icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
      }
    });
  }

  // Messages Button
  const messagesBtn = document.getElementById('messages-notification');
  if (messagesBtn) {
    messagesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openMessagesModal();
    });
  }
  
  // Smooth Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#') && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Load Data
  if (supabaseInitialized) {
    loadBundles();
    loadGalleryPreview();
  }
  
  setupContactForm();
  setupGalleryFilters();
  
  // Close modals on outside click
  window.addEventListener('click', (e) => {
    const galleryModal = document.getElementById('galleryModal');
    if (e.target === galleryModal) {
      closeGalleryModal();
    }
    
    const messagesModal = document.querySelector('.messages-modal');
    if (e.target === messagesModal) {
      closeMessagesModal();
    }
    
    const imageModal = document.getElementById('imageViewModal');
    if (e.target === imageModal) {
      closeImageModal();
    }
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-toggle') && !e.target.closest('.dropdown-menu')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });
  
  // Dropdown toggles
  document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdown = this.nextElementSibling;
      if (dropdown && dropdown.classList.contains('dropdown-menu')) {
        dropdown.classList.toggle('show');
      }
    });
  });
});

// Export Global Functions
window.showBundles = showBundles;
window.hideBundles = hideBundles;
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.selectBundle = selectBundle;
window.loadBundles = loadBundles;
window.loadGalleryPreview = loadGalleryPreview;
window.openWhatsApp = openWhatsApp;
window.callNow = callNow;
window.sendEmail = sendEmail;
window.openLocation = openLocation;
window.openFacebook = openFacebook;
window.openTwitter = openTwitter;
window.openInstagram = openInstagram;
window.openMessagesModal = openMessagesModal;
window.closeMessagesModal = closeMessagesModal;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.refreshNotifications = refreshNotifications;
window.exportNotifications = exportNotifications;
window.closeNotification = closeNotification;
window.closeImageModal = closeImageModal;
