// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAtt28zOdzpr_CraaSFHzvIOcwggqMYuvE",
  authDomain: "starlink-token-wifi.firebaseapp.com",
  projectId: "starlink-token-wifi",
  storageBucket: "starlink-token-wifi.firebasestorage.app",
  messagingSenderId: "61255418270",
  appId: "1:61255418270:web:920ad2fa18a7e378e0168f",
  measurementId: "G-0QEVK81Q4V"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Starlink WiFi';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/logo.png',
    data: payload.data
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // Handle click action
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
