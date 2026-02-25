// js/firebase-config.js
// Import Firebase modules (without Auth)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, push, set, remove, update, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// Your Firebase configuration
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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const database = getDatabase(app);
const storage = getStorage(app);
let messaging = null;

// Initialize messaging only if supported
if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
        messaging = getMessaging(app);
    } catch (error) {
        console.warn('Firebase Messaging initialization failed:', error);
    }
}

// Database references
const dbRefs = {
    gallery: ref(database, 'gallery'),
    bundles: ref(database, 'bundles'),
    messages: ref(database, 'messages'),
    updates: ref(database, 'updates'),
    purchases: ref(database, 'purchase_attempts'),
    notifications: ref(database, 'notifications'),
    subscribers: ref(database, 'newsletter_subscribers'),
    settings: ref(database, 'settings'),
    admin: ref(database, 'admin') // We'll store admin credentials here
};

// Gallery functions
const galleryManager = {
    async uploadImage(file, title, description, category = 'general') {
        try {
            // Create a unique filename
            const timestamp = Date.now();
            const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const filePath = `gallery/${filename}`;
            
            // Create storage reference
            const imageRef = storageRef(storage, filePath);
            
            // Upload file
            const snapshot = await uploadBytes(imageRef, file);
            
            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Prepare image data
            const imageData = {
                url: downloadURL,
                title: title || '',
                description: description || '',
                category: category,
                filename: file.name,
                timestamp: timestamp,
                visible: true,
                size: file.size,
                type: file.type
            };
            
            // Save to database
            const newImageRef = push(dbRefs.gallery, imageData);
            
            return {
                success: true,
                id: newImageRef.key,
                url: downloadURL,
                data: imageData
            };
            
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },
    
    async getImages() {
        try {
            const snapshot = await get(dbRefs.gallery);
            const data = snapshot.val();
            
            if (!data) {
                return { success: true, images: [] };
            }
            
            // Convert to array
            const images = Object.entries(data).map(([id, image]) => ({
                id,
                ...image
            }));
            
            return { success: true, images };
        } catch (error) {
            console.error('Error getting images:', error);
            throw error;
        }
    },
    
    async deleteImage(imageId, imageUrl) {
        try {
            // Delete from database
            await remove(ref(database, `gallery/${imageId}`));
            
            // Try to delete from storage if URL is provided
            if (imageUrl) {
                try {
                    // Extract path from URL
                    const urlObj = new URL(imageUrl);
                    const path = decodeURIComponent(urlObj.pathname.split('/o/')[1]?.split('?')[0]);
                    
                    if (path) {
                        const imageStorageRef = storageRef(storage, path);
                        await deleteObject(imageStorageRef);
                    }
                } catch (storageError) {
                    console.warn('Could not delete from storage:', storageError);
                    // Continue even if storage delete fails
                }
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    },
    
    async updateImage(imageId, updates) {
        try {
            await update(ref(database, `gallery/${imageId}`), {
                ...updates,
                updated: Date.now()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating image:', error);
            throw error;
        }
    }
};

// Bundle functions
const bundleManager = {
    async getBundles() {
        try {
            const snapshot = await get(dbRefs.bundles);
            const data = snapshot.val();
            
            if (!data) {
                return { success: true, bundles: [] };
            }
            
            const bundles = Object.entries(data).map(([id, bundle]) => ({
                id,
                ...bundle
            }));
            
            return { success: true, bundles };
        } catch (error) {
            console.error('Error getting bundles:', error);
            throw error;
        }
    },
    
    async updateBundle(bundleId, bundleData) {
        try {
            const bundleRef = ref(database, `bundles/${bundleId}`);
            const snapshot = await get(bundleRef);
            
            const updates = {
                ...bundleData,
                updated: Date.now()
            };
            
            if (snapshot.exists()) {
                await update(bundleRef, updates);
            } else {
                await set(bundleRef, {
                    ...updates,
                    created: Date.now()
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error updating bundle:', error);
            throw error;
        }
    },
    
    async deleteBundle(bundleId) {
        try {
            await remove(ref(database, `bundles/${bundleId}`));
            return { success: true };
        } catch (error) {
            console.error('Error deleting bundle:', error);
            throw error;
        }
    }
};

// Message functions
const messageManager = {
    async sendMessage(messageData) {
        try {
            const messageWithMetadata = {
                ...messageData,
                timestamp: Date.now(),
                read: false,
                status: 'received'
            };
            
            const newMessageRef = push(dbRefs.messages, messageWithMetadata);
            
            return {
                success: true,
                id: newMessageRef.key,
                message: messageWithMetadata
            };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },
    
    async getMessages() {
        try {
            const snapshot = await get(dbRefs.messages);
            const data = snapshot.val();
            
            if (!data) {
                return { success: true, messages: [] };
            }
            
            const messages = Object.entries(data)
                .map(([id, message]) => ({
                    id,
                    ...message
                }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            return { success: true, messages };
        } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
        }
    },
    
    async updateMessage(messageId, updates) {
        try {
            await update(ref(database, `messages/${messageId}`), updates);
            return { success: true };
        } catch (error) {
            console.error('Error updating message:', error);
            throw error;
        }
    },
    
    async deleteMessage(messageId) {
        try {
            await remove(ref(database, `messages/${messageId}`));
            return { success: true };
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }
};

// Admin functions (using Firebase Database for simple auth)
const adminManager = {
    async login(email, password) {
        try {
            const snapshot = await get(ref(database, 'admin/credentials'));
            const adminData = snapshot.val();
            
            if (!adminData) {
                // First time setup - create default admin
                const defaultAdmin = {
                    email: 'admin@starlinkwifi.com',
                    password: this.hashPassword('admin123'), // Simple hash
                    created: Date.now()
                };
                
                await set(ref(database, 'admin/credentials'), defaultAdmin);
                
                // Check if credentials match
                if (email === defaultAdmin.email && this.hashPassword(password) === defaultAdmin.password) {
                    return { success: true, message: 'Login successful' };
                }
            } else {
                // Check credentials
                if (email === adminData.email && this.hashPassword(password) === adminData.password) {
                    return { success: true, message: 'Login successful' };
                }
            }
            
            return { success: false, message: 'Invalid credentials' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed' };
        }
    },
    
    hashPassword(password) {
        // Simple hash function (use bcrypt in production)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    },
    
    isAuthenticated() {
        return localStorage.getItem('adminAuthenticated') === 'true';
    },
    
    setAuthenticated(value) {
        if (value) {
            localStorage.setItem('adminAuthenticated', 'true');
        } else {
            localStorage.removeItem('adminAuthenticated');
        }
    },
    
    logout() {
        this.setAuthenticated(false);
        return { success: true, message: 'Logged out successfully' };
    }
};

// Initialize Firebase Messaging
async function initializeMessaging() {
    if (!messaging) {
        console.log('Messaging not supported');
        return null;
    }
    
    try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
        
        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            
            // Get FCM token
            const currentToken = await getToken(messaging, {
                serviceWorkerRegistration: registration,
                vapidKey: 'BL6NG4P...' // Get this from Firebase Console
            });
            
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                return currentToken;
            } else {
                console.log('No registration token available.');
                return null;
            }
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (error) {
        console.error('Error initializing messaging:', error);
        return null;
    }
}

// Export all functions and objects
export {
    // Firebase app and services
    app,
    database,
    storage,
    messaging,
    
    // Database references
    dbRefs,
    ref,
    onValue,
    push,
    set,
    remove,
    update,
    get,
    child,
    
    // Storage functions
    storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    
    // Managers
    galleryManager,
    bundleManager,
    messageManager,
    adminManager,
    
    // Utility functions
    initializeMessaging
};
