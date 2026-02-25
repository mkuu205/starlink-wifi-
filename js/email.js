// Online Email functionality - no localStorage fallback
class EmailManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupContactForm();
    }

    setupContactForm() {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendEmail();
            });
        }
    }

    async sendEmail() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const service = document.getElementById('service').value;
        const message = document.getElementById('message').value;
        const formMessage = document.getElementById('form-message');

        try {
            // Determine backend URL based on environment
            const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : 'https://starlink-wifi-backend-v862.onrender.com';
            
            // Send to backend API
            const response = await fetch(`${backendUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    service: service,
                    message: message
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success message
                formMessage.innerHTML = '<p class="success">Message sent successfully! We\'ll contact you soon.</p>';
                formMessage.style.color = 'green';
                document.getElementById('contact-form').reset();
                
                // Auto-hide message after 5 seconds
                setTimeout(() => {
                    formMessage.innerHTML = '';
                }, 5000);
            } else {
                throw new Error(result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            formMessage.innerHTML = `
                <p class="error">Error sending message. Please try again or call us directly.</p>
                <p class="error" style="font-size: 0.9em;">📞 WhatsApp: +254740851330</p>
                <p class="error" style="font-size: 0.9em;">📧 Email: starlinktokenwifi@gmail.com</p>
            `;
            formMessage.style.color = 'red';
        }
    }
}

// Initialize email manager
const emailManager = new EmailManager();
