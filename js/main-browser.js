// main-browser.js - Main Website Script with Fixes
// Email: support@starlinktokenwifi.com (forwards to billnjehia18@gmail.com)

console.log('Starlink Token WiFi - Main Script Loading...');

// Supabase Configuration
const SUPABASE_URL = 'https://jgaeldguwezbgglwaivz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ';

// Global Variables
let supabaseClient = null;
let messaging = null;
let fcmToken = null;

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
      showNotification(
        payload.notification?.title || 'New Update', 
        payload.notification?.body || 'You have a new notification'
      );
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
      
      // ⚠️ IMPORTANT: Replace with your actual VAPID key from Firebase Console
      // Get it from: Firebase Console > Project Settings > Cloud Messaging > Web Push Certificates
      const vapidKey = 'BL2-1Ej72YPhk-TH1tExzaWd3eiUL_nzL2MMNwr8F9n1Nz3SxgOD88XOgoFIZIRTrsh1i9iXw_hsBYxEKffT7hY'; // <-- REPLACE THIS WITH YOUR ACTUAL KEY
      
      if (vapidKey && vapidKey !== 'BL2-1Ej72YPhk-TH1tExzaWd3eiUL_nzL2MMNwr8F9n1Nz3SxgOD88XOgoFIZIRTrsh1i9iXw_hsBYxEKffT7hY') {
        try {
          fcmToken = await messaging.getToken({ vapidKey: vapidKey });
          console.log('✅ FCM Token received:', fcmToken);
          await saveFCMToken(fcmToken);
        } catch (tokenError) {
          console.error('Error getting FCM token:', tokenError);
        }
      } else {
        console.warn('⚠️ VAPID key not configured. Add your VAPID key from Firebase Console.');
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
    
    const { error } = await supabaseClient
      .from('push_subscriptions')
      .upsert({
        device_id: deviceId,
        fcm_token: token,
        platform: 'web',
        user_agent: navigator.userAgent,
        last_active: new Date().toISOString()
      }, { onConflict: 'device_id' });
    
    if (error) throw error;
    console.log('✅ FCM token saved to database');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}

// Show Notification Toast
function showNotification(title, message) {
  const toast = document.getElementById('notification-toast');
  const messageElement = document.getElementById('notification-message');
  
  if (toast && messageElement) {
    messageElement.innerHTML = '<strong>' + title + ':</strong> ' + message;
    toast.classList.add('show');
    
    setTimeout(function() {
      toast.classList.remove('show');
    }, 5000);
  }
}

function closeNotification() {
  const toast = document.getElementById('notification-toast');
  if (toast) {
    toast.classList.remove('show');
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing...');
  
  const supabaseInitialized = initializeSupabase();
  
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
      if (typeof window.openNotificationsModal === 'function') {
        window.openNotificationsModal();
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
    loadNotifications();
    setInterval(checkForNewNotifications, 30000);
  } else {
    showSupabaseError();
  }
  
  setupContactForm();
});

// Show Supabase Error
function showSupabaseError() {
  const bundlesContainer = document.getElementById('bundles-container');
  const previewContainer = document.getElementById('gallery-preview-container');
  
  const errorHtml = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">' +
    '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
    '<h3>Connection Error</h3>' +
    '<p>Unable to connect to server. Please refresh the page.</p>' +
    '</div>';
  
  if (bundlesContainer) bundlesContainer.innerHTML = errorHtml;
  if (previewContainer) previewContainer.innerHTML = errorHtml;
}

// Check for New Notifications
async function checkForNewNotifications() {
  try {
    if (!supabaseClient) return;
    
    const lastChecked = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString();
    
    const { data, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('sent', true)
      .gt('created_at', lastChecked)
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      const latest = data[0];
      showNotification('New Update', latest.message || latest.content);
      updateNotificationsBadge();
      
      const modal = document.getElementById('messagesModal');
      if (modal && modal.style.display === 'block') {
        displayNotifications(data);
      }
      
      localStorage.setItem('lastNotificationCheck', new Date().toISOString());
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
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
      // Use correct backend URL
      const backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://starlink-wifi-backend-v862.onrender.com';
      
      console.log('Sending to:', backendUrl);
      
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

// Load Gallery Preview - FIXED
async function loadGalleryPreview() {
  const container = document.getElementById('gallery-preview-container');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-gallery">' +
    '<div class="loading-item"></div><div class="loading-item"></div><div class="loading-item"></div></div>';
  
  try {
    if (!supabaseClient) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseClient
      .from('gallery')
      .select('id, title, description, category, image_url, url, visible')
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

// Create Gallery Preview Item - FIXED with better image handling
function createGalleryPreviewItem(item) {
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-preview-item';
  galleryItem.style.cssText = 'position: relative; overflow: hidden; border-radius: 8px;';
  
  // Try multiple URL fields
  const imageUrl = item.image_url || item.url || item.storage_url;
  
  const imgWrapper = document.createElement('div');
  imgWrapper.style.cssText = 'width: 100%; height: 250px; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;';
  
  const img = document.createElement('img');
  img.alt = item.title || 'Project Image';
  img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: cover; width: 100%; height: 100%;';
  
  img.onerror = function() {
    console.warn('Failed to load image:', imageUrl);
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
  
  // Overlay
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

// Load Full Gallery
async function loadFullGallery() {
  const container = document.getElementById('modalGalleryContainer');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 4rem;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #3b82f6;"></i>' +
    '<p>Loading gallery...</p></div>';
  
  try {
    if (!supabaseClient) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseClient
      .from('gallery')
      .select('id, title, description, category, image_url, url, visible')
      .eq('visible', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 4rem;">' +
        '<i class="fas fa-images" style="font-size: 3rem; color: #9ca3af;"></i>' +
        '<h3>No Gallery Items Available</h3></div>';
      return;
    }
    
    data.forEach(item => container.appendChild(createModalGalleryItem(item)));
    setupGalleryFilters();
  } catch (error) {
    console.error('Error loading gallery:', error);
    container.innerHTML = '<div style="text-align: center; padding: 4rem;">' +
      '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>' +
      '<h3>Unable to Load Gallery</h3>' +
      '<button onclick="loadFullGallery()" class="btn btn-secondary"><i class="fas fa-redo"></i> Retry</button></div>';
  }
}

function createModalGalleryItem(item) {
  const galleryItem = document.createElement('div');
  galleryItem.className = 'modal-gallery-item';
  galleryItem.dataset.filter = item.category || 'all';
  galleryItem.style.cssText = 'cursor: pointer; position: relative; overflow: hidden; border-radius: 8px;';
  
  const imageUrl = item.image_url || item.url || item.storage_url;
  
  const imgWrapper = document.createElement('div');
  imgWrapper.style.cssText = 'width: 100%; height: 200px; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;';
  
  const img = document.createElement('img');
  img.alt = item.title || 'Project Image';
  img.loading = 'lazy';
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
  
  galleryItem.addEventListener('click', () => showFullImage(imageUrl, item.title || 'Project Image'));
  
  return galleryItem;
}

function showFullImage(imageUrl, title) {
  if (!imageUrl) return;
  
  let modal = document.getElementById('fullImageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'fullImageModal';
    modal.style.cssText = 'display: none; position: fixed; z-index: 3000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); align-items: center; justify-content: center;';
    modal.innerHTML = '<div style="position: relative; max-width: 90%; max-height: 90%;">' +
      '<button id="fullImageClose" style="position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;"><i class="fas fa-times"></i></button>' +
      '<img id="fullImage" src="" alt="" style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 8px;">' +
      '</div>';
    document.body.appendChild(modal);
    
    document.getElementById('fullImageClose').addEventListener('click', closeFullImage);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeFullImage(); });
  }
  
  const img = document.getElementById('fullImage');
  img.src = imageUrl;
  img.alt = title;
  img.onerror = function() {
    this.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
  };
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeFullImage() {
  const modal = document.getElementById('fullImageModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function setupGalleryFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      buttons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      filterGalleryItems(filter);
    });
  });
}

function filterGalleryItems(filter) {
  const items = document.querySelectorAll('.modal-gallery-item');
  items.forEach(item => {
    const itemFilter = item.dataset.filter || 'all';
    if (filter === 'all' || itemFilter === filter) {
      item.style.display = 'block';
      setTimeout(() => item.style.opacity = '1', 100);
    } else {
      item.style.opacity = '0';
      setTimeout(() => item.style.display = 'none', 300);
    }
  });
}

// Notifications Functions
async function loadNotifications() {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
  try {
    if (!supabaseClient) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('sent', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    window.notifications = data || [];
    displayNotifications(window.notifications);
    updateNotificationsBadge();
  } catch (error) {
    console.error('Error loading notifications:', error);
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">' +
      '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>' +
      '<h3>Error Loading Notifications</h3></div>';
  }
}

function displayNotifications(list) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  
  if (!list || list.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
      '<i class="fas fa-bell-slash" style="font-size: 3rem; color: #ccc;"></i>' +
      '<p>No notifications yet</p></div>';
    return;
  }
  
  const lastView = localStorage.getItem('lastNotificationsView');
  let html = '';
  
  list.forEach(notification => {
    const time = new Date(notification.created_at).toLocaleString();
    const isNew = lastView ? new Date(notification.created_at) > new Date(lastView) : true;
    
    html += '<div class="message-item' + (isNew ? ' unread' : '') + '" data-id="' + notification.id + '" onclick="markNotificationAsRead(\'' + notification.id + '\')">' +
      '<div class="message-header">' +
      '<div class="message-sender"><i class="fas fa-bullhorn" style="color: #3b82f6; margin-right: 0.5rem;"></i>Admin Update</div>' +
      '<div class="message-time">' + time + '</div></div>';
    
    if (notification.title) {
      html += '<div style="font-weight: bold; margin: 0.5rem 0; color: #333;">' + notification.title + '</div>';
    }
    
    html += '<div class="message-content">' + (notification.message || notification.content || '') + '</div></div>';
  });
  
  container.innerHTML = html;
}

function markNotificationAsRead(id) {
  const item = document.querySelector('.message-item[data-id="' + id + '"]');
  if (item) item.classList.remove('unread');
  updateNotificationsBadge();
}

async function markAllNotificationsAsRead() {
  localStorage.setItem('lastNotificationsView', new Date().toISOString());
  document.querySelectorAll('.message-item').forEach(item => item.classList.remove('unread'));
  updateNotificationsBadge();
  showNotification('All notifications marked as read', 'success');
}

async function updateNotificationsBadge() {
  try {
    if (!supabaseClient) return;
    
    const lastView = localStorage.getItem('lastNotificationsView');
    let query = supabaseClient.from('notifications').select('*', { count: 'exact', head: true }).eq('sent', true);
    if (lastView) query = query.gt('created_at', lastView);
    
    const { count, error } = await query;
    if (error) throw error;
    
    const badge = document.getElementById('message-count');
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
  const modal = document.getElementById('messagesModal');
  const title = document.getElementById('messagesModalTitle');
  
  if (modal) {
    if (title) title.innerHTML = '<i class="fas fa-bell"></i> Notifications & Updates';
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

function exportNotifications() {
  const notifications = window.notifications || [];
  if (notifications.length === 0) {
    showNotification('No notifications to export', 'warning');
    return;
  }
  
  const headers = ['Title', 'Message', 'Date'];
  const rows = [headers.join(',')];
  
  notifications.forEach(n => {
    rows.push([
      '"' + (n.title || '') + '"',
      '"' + (n.message || n.content || '') + '"',
      '"' + new Date(n.created_at).toLocaleString() + '"'
    ].join(','));
  });
  
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notifications_' + new Date().toISOString().split('T')[0] + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showNotification('Notifications exported successfully', 'success');
}

// Utility Functions
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
  if (!document.querySelector('.modal-gallery-item')) loadFullGallery();
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

console.log('✅ Main script initialized');

