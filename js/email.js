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
            // Send to online backend API
            const response = await fetch('/api/contact', {
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
            formMessage.innerHTML = '<p class="error">Error sending message. Please try again.</p>';
            formMessage.style.color = 'red';
        }
    }
}

// Initialize email manager
const emailManager = new EmailManager();
