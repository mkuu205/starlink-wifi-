// main-browser.js - Complete Main Website Script with Notification System
// Email: support@starlinktokenwifi.com (forwards to billnjehia18@gmail.com)

console.log('🚀 Starlink Token WiFi - Main Script Loading...');

// Supabase Configuration
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ';

// Global Variables
let supabaseClient = null;
let messaging = null;
let fcmToken = null;
let notificationSystem = null;

// ==================== SUPABASE INITIALIZATION ====================

// Initialize Supabase
function initializeSupabase() {
  if (window.supabase && window.supabase.createClient) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase client initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      return false;
    }
  }
  console.warn('⚠️ Supabase library not loaded');
  return false;
}

// ==================== NOTIFICATION SYSTEM ====================

// Notification System Class
class NotificationSystem {
  constructor() {
    this.supabase = supabaseClient;
    this.pollInterval = 30000; // 30 seconds
    this.lastCheck = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString();
    this.notifications = [];
    this.unreadCount = 0;
    this.backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'https://starlink-wifi-backend-v862.onrender.com';
    this.init();
  }
  
  init() {
    console.log('🔔 Initializing notification system...');
    this.setupNotificationCenter();
    this.startPolling();
    this.setupToast();
    // Load initial notifications
    this.loadNotifications();
  }
  
  setupToast() {
    // Create toast if it doesn't exist
    if (!document.getElementById('notification-toast')) {
      const toast = document.createElement('div');
      toast.id = 'notification-toast';
      toast.className = 'notification-toast';
      toast.innerHTML = `
        <div class="toast-icon">
          <i class="fas fa-bell"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title" id="toast-title">New Notification</div>
          <div class="toast-message" id="toast-message"></div>
        </div>
        <button class="toast-close" onclick="this.parentElement.classList.remove('show')">
          <i class="fas fa-times"></i>
        </button>
      `;
      document.body.appendChild(toast);
    }
  }
  
  startPolling() {
    console.log('🔔 Starting notification polling every 30 seconds...');
    this.checkForNewNotifications();
    setInterval(() => this.checkForNewNotifications(), this.pollInterval);
  }
  
  async checkForNewNotifications() {
    try {
      console.log('Checking for new notifications since:', this.lastCheck);
      
      // FIXED: Use backend API endpoint instead of direct Supabase query
      const response = await fetch(
        `${this.backendUrl}/api/notifications?since=${encodeURIComponent(this.lastCheck)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const data = result.notifications || [];
      
      console.log(`📬 Received ${data.length} new notifications`);
      
      if (data && data.length > 0) {
        // Add to notifications array
        this.notifications = [...data, ...this.notifications];
        
        // Show toast for each new notification (limit to avoid spam)
        data.slice(0, 3).forEach(notification => {
          this.showNotificationToast(
            notification.title || 'New Update',
            notification.message || notification.content || ''
          );
        });
        
        // Update the notification center
        this.updateNotificationCenter();
        
        // FIXED: Update lastCheck with the most recent notification timestamp
        this.lastCheck = data[0].created_at;
        
        // Play sound for urgent notifications
        if (data.some(n => n.priority === 'urgent')) {
          this.playNotificationSound();
        }
      } else {
        // FIXED: If no new notifications, still update lastCheck to current time
        this.lastCheck = new Date().toISOString();
      }
      
      // Save last check time
      localStorage.setItem('lastNotificationCheck', this.lastCheck);
      
    } catch (error) {
      console.error('Error checking notifications:', error);
      // FIXED: Don't skip future checks - update to current time even on error
      this.lastCheck = new Date().toISOString();
      localStorage.setItem('lastNotificationCheck', this.lastCheck);
    }
  }
  
  showNotificationToast(title, message) {
    const toast = document.getElementById('notification-toast');
    const titleElement = document.getElementById('toast-title');
    const messageElement = document.getElementById('toast-message');
    
    if (toast && titleElement && messageElement) {
      titleElement.textContent = title;
      messageElement.textContent = message;
      toast.classList.add('show');
      
      // Auto hide after 8 seconds
      setTimeout(() => {
        toast.classList.remove('show');
      }, 8000);
    }
  }
  
  playNotificationSound() {
    // Optional: Play sound for urgent notifications
    // const audio = new Audio('/notification.mp3');
    // audio.play().catch(e => console.log('Audio play failed:', e));
  }
  
  setupNotificationCenter() {
    // Check if modal exists, if not create it
    if (!document.getElementById('messagesModal')) {
      this.createNotificationModal();
    }
    
    // Setup close button
    const closeBtn = document.querySelector('#messagesModal .close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeNotificationCenter());
    }
    
    // Setup mark all read button
    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => this.markAllAsRead());
    }
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-notifications');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshNotifications());
    }
    
    // Setup export button
    const exportBtn = document.getElementById('export-notifications');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportNotifications());
    }
  }
  
  createNotificationModal() {
    const modal = document.createElement('div');
    modal.id = 'messagesModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2><i class="fas fa-bell"></i> Notifications & Updates</h2>
          <div class="modal-actions">
            <button id="refresh-notifications" class="btn-icon" title="Refresh">
              <i class="fas fa-sync-alt"></i>
            </button>
            <button id="export-notifications" class="btn-icon" title="Export">
              <i class="fas fa-download"></i>
            </button>
            <button id="mark-all-read" class="btn-icon" title="Mark all as read">
              <i class="fas fa-check-double"></i>
            </button>
            <span class="close">&times;</span>
          </div>
        </div>
        <div class="modal-body">
          <div id="messagesContainer" class="messages-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i> Loading notifications...
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <span id="notification-count">0 unread</span>
          <button onclick="window.notificationSystem?.markAllAsRead()" class="btn-link">
            Mark all read
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  async loadNotifications() {
    try {
      const container = document.getElementById('messagesContainer');
      if (!container) return;
      
      container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading notifications...</div>';
      
      // FIXED: Use backend API endpoint
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
        container.innerHTML = '<div class="error-message">Failed to load notifications</div>';
      }
    }
  }
  
  updateNotificationCenter() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    if (!this.notifications || this.notifications.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
      `;
      this.updateBadge();
      return;
    }
    
    let html = '';
    
    this.notifications.forEach(notification => {
      const timeAgo = this.timeAgo(new Date(notification.created_at));
      const priority = notification.priority || 'normal';
      
      html += `
        <div class="notification-item" data-id="${notification.id}" data-created="${notification.created_at}">
          <div class="notification-icon">
            <i class="fas ${this.getPriorityIcon(priority)}"></i>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <strong>${notification.title || 'System Update'}</strong>
              <span class="notification-time">${timeAgo}</span>
            </div>
            <div class="notification-message">
              ${notification.message || notification.content || ''}
            </div>
            ${priority === 'urgent' ? '<span class="urgent-badge">URGENT</span>' : ''}
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
    // Update badge
    this.updateBadge();
  }
  
  getPriorityIcon(priority) {
    switch(priority) {
      case 'urgent': return 'fa-exclamation-circle';
      case 'high': return 'fa-arrow-circle-up';
      case 'low': return 'fa-arrow-circle-down';
      default: return 'fa-bell';
    }
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
    this.updateBadge();
    
    // Show toast
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
  
  // FIXED: Improved badge logic
  updateBadge() {
    const badge = document.getElementById('message-count');
    if (!badge) return;
    
    // FIXED: Calculate unread based on last view timestamp
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
    const modal = document.getElementById('messagesModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      this.loadNotifications();
    }
  }
  
  closeNotificationCenter() {
    const modal = document.getElementById('messagesModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
}

// ==================== FIREBASE MESSAGING ====================

// Initialize Firebase Cloud Messaging
async function initializeMessaging() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase not loaded');
    return false;
  }
  
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return false;
  }
  
  try {
    // Register Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Service Worker registered');
    
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyAtt28zOdzpr_CraaSFHzvIOcwggqMYuvE",
      authDomain: "starlink-token-wifi.firebaseapp.com",
      projectId: "starlink-token-wifi",
      storageBucket: "starlink-token-wifi.firebasestorage.app",
      messagingSenderId: "61255418270",
      appId: "1:61255418270:web:920ad2fa18a7e378e0168f"
    };
    
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    // Request Permission and Get Token
    await requestNotificationPermission();
    
    // Handle Foreground Messages
    messaging.onMessage((payload) => {
      console.log('Foreground message received:', payload);
      if (notificationSystem) {
        notificationSystem.showNotificationToast(
          payload.notification?.title || 'New Update',
          payload.notification?.body || 'You have a new notification'
        );
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing messaging:', error);
    return false;
  }
}

// Request Notification Permission
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      const vapidKey = 'BL2-1Ej72YPhk-TH1tExzaWd3eiUL_nzL2MMNwr8F9n1Nz3SxgOD88XOgoFIZIRTrsh1i9iXw_hsBYxEKffT7hY';
      
      try {
        fcmToken = await messaging.getToken({ vapidKey: vapidKey });
        console.log('✅ FCM Token received:', fcmToken);
        await saveFCMToken(fcmToken);
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
      }
    } else {
      console.warn('❌ Notification permission denied');
    }
  } catch (error) {
    console.error('Error requesting permission:', error);
  }
}

// Save FCM Token to Database
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
    
    console.log('✅ FCM token saved to database');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}

// ==================== PAGE FUNCTIONS ====================

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

// Load Gallery Preview
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
      .limit(3);
    
    if (error) throw error;
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
        '<i class="fas fa-images" style="font-size: 3rem; color: #9ca3af;"></i>' +
        '<h3>No Gallery Items Yet</h3></div>';
      return;
    }
    
    data.forEach(item => container.appendChild(createGalleryPreviewItem(item)));
  } catch (error) {
    console.error('Error loading gallery:', error);
    container.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
      '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>' +
      '<h3>Unable to Load Gallery</h3>' +
      '<button onclick="loadGalleryPreview()" class="btn btn-secondary"><i class="fas fa-redo"></i> Retry</button></div>';
  }
}

function createGalleryPreviewItem(item) {
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-preview-item';
  galleryItem.style.cssText = 'position: relative; overflow: hidden; border-radius: 8px;';
  
  const imageUrl = item.image_url || item.url;
  
  const imgWrapper = document.createElement('div');
  imgWrapper.style.cssText = 'width: 100%; height: 250px; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;';
  
  const img = document.createElement('img');
  img.alt = item.title || 'Project Image';
  img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: cover; width: 100%; height: 100%;';
  
  img.onerror = function() {
    this.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.innerHTML = '<i class="fas fa-image" style="font-size: 3rem; color: #9ca3af;"></i>';
    imgWrapper.appendChild(placeholder);
  };
  
  if (imageUrl) {
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

// Setup Contact Form
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

// ==================== INITIALIZATION ====================

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing...');
  
  const supabaseInitialized = initializeSupabase();
  
  // FIXED: Initialize notification system immediately if Supabase is ready
  if (supabaseInitialized) {
    notificationSystem = new NotificationSystem();
    window.notificationSystem = notificationSystem;
  }
  
  // Initialize messaging after delay
  setTimeout(() => {
    initializeMessaging();
  }, 1000);
  
  // Mobile Menu Toggle
  const mobileMenu = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      mobileMenu.innerHTML = navLinks.classList.contains('active')
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });
  }

  // Messages Button
  const messagesBtn = document.getElementById('messages-notification');
  if (messagesBtn) {
    messagesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (notificationSystem) {
        notificationSystem.openNotificationCenter();
      }
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
  
  // Setup modal close on outside click
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('messagesModal');
    if (e.target === modal && notificationSystem) {
      notificationSystem.closeNotificationCenter();
    }
  });
});

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

function openGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (!modal) return;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  if (!document.querySelector('.modal-gallery-item')) 
}

function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
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
window.openNotificationsModal = () => notificationSystem?.openNotificationCenter();
window.closeMessagesModal = () => notificationSystem?.closeNotificationCenter();
window.markAllNotificationsAsRead = () => notificationSystem?.markAllAsRead();
window.refreshNotifications = () => notificationSystem?.refreshNotifications();
window.exportNotifications = () => notificationSystem?.exportNotifications();

console.log('✅ Main script initialized');


