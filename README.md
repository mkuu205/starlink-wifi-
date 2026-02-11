# Starlink Token WiFi - Production Website

A professional WiFi service website with admin panel, real-time notifications, and email integration.

## 🚀 Features

- **Admin Panel** with image upload and bundle management
- **Real-time Email Notifications** using Nodemailer
- **Secure Authentication** via Supabase
- **Contact Form** integrated with Formspree
- **Message Notifications** with real-time badge updates
- **Responsive Design** for all devices

## 🛠️ Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your actual credentials:
```env
# Supabase Configuration
SUPABASE_URL=your_actual_supabase_url
SUPABASE_KEY=your_actual_supabase_key

# Email Configuration  
EMAIL_USER=your_business_email@gmail.com
EMAIL_PASS=your_app_password
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Create these tables:

**Gallery Table:**
```sql
CREATE TABLE gallery (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  filename TEXT,
  timestamp BIGINT,
  visible BOOLEAN DEFAULT true,
  size INTEGER,
  type TEXT
);
```

**Messages Table:**
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service TEXT,
  message TEXT NOT NULL,
  timestamp BIGINT,
  read BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'received'
);
```

**Bundles Table:**
```sql
CREATE TABLE bundles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  features JSONB,
  visible BOOLEAN DEFAULT true,
  updated BIGINT
);
```

**Notifications Table:**
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  timestamp BIGINT,
  read BOOLEAN DEFAULT false
);
```

3. Create Storage Bucket:
   - Go to Storage → Create Bucket
   - Name: `images`
   - Set public access for reads

### 3. Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Generate app password
3. Update EMAIL_PASS in `.env`

For production, consider:
- SendGrid
- Mailgun  
- Amazon SES

### 4. Development Server

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

## 🔧 File Structure

```
starlink-wifi--main/
├── .env                 # Environment variables (private)
├── .env.example         # Environment template
├── index.html          # Main website
├── admin.html          # Admin panel
├── admin-login.html    # Admin login
├── css/
│   ├── style.css       # Main styles
│   └── admin.css       # Admin styles
├── js/
│   ├── config.js       # Environment configuration
│   ├── supabase-config.js  # Database integration
│   ├── nodemailer.js   # Email notifications
│   ├── admin.js        # Admin functionality
│   ├── main.js         # Main website scripts
│   └── modern.js       # Additional scripts
└── uploads/            # Uploaded files (if using local storage)
```

## 📧 Email Notifications

The system sends automated emails for:
- New contact form submissions
- Image uploads
- Bundle updates
- Site notifications

## 🔒 Security

- Supabase authentication for admin panel
- Environment variables for sensitive data
- Formspree for contact form security
- Proper error handling

## 🎯 Production Deployment

1. Update `APP_ENV=production` in `.env`
2. Set proper CORS origins in Supabase
3. Configure your domain in Formspree
4. Deploy to your preferred hosting platform

## 🆘 Troubleshooting

**Common Issues:**

1. **Supabase Connection Failed**
   - Check SUPABASE_URL and SUPABASE_KEY
   - Verify Supabase project is active

2. **Email Not Sending**
   - Verify EMAIL_USER and EMAIL_PASS
   - Check app password for Gmail
   - Ensure less secure apps access (if applicable)

3. **Images Not Uploading**
   - Check Supabase Storage bucket permissions
   - Verify network connectivity

## 📞 Support

For issues or questions:
- Email: starlinktokenwifi@gmail.com
- WhatsApp: +254740851330

---
Built with ❤️ using modern web technologies