// js/config.js - Production Configuration
// Connected to live backend

const config = {
    // API Configuration
    api: {
        baseUrl: 'https://starlink-wifi-backend-v862.onrender.com/api',
        timeout: 30000, // 30 seconds
        retries: 3
    },
    
    // Email Configuration
    email: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'support@starlinktokenwifi.com',
            pass: process.env.EMAIL_PASS || '' // This will be set on backend
        },
        sender: 'Starlink WiFi <support@starlinktokenwifi.com>',
        admin: 'billnjehia18@gmail.com'
    },
    
    // Supabase Configuration (for direct frontend access if needed)
    supabase: {
        url: 'https://jgaeldguwezbgglwaivz.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWVsZGd1d2V6YmdnbHdhaXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg1NTAsImV4cCI6MjA4NjE1NDU1MH0.pAkRxRs1gvmrJJR_CNietYes6ju6qOMP8Etnpr3TtyQ'
    },
    
    // Feature Flags
    features: {
        emailNotifications: true,
        contactForm: true,
        gallery: true,
        bundles: true
    }
};

// Export configuration
export { config };
