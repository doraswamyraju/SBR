import React, { useState } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
// This icon is specifically used within the ContactModal.
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


// Contact Pop-up Modal Component
const ContactModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [formStatus, setFormStatus] = useState('');

    // Handles form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormStatus("Thank you! Your message has been sent.");
        console.log("Form Data Submitted:", formData); // Log form data for demonstration
        setFormData({ name: '', email: '', phone: '' }); // Clear form fields
        // Close modal after a short delay
        setTimeout(() => {
            setFormStatus('');
            onClose();
        }, 3000);
    };

    // If the modal is not open, return null to not render anything
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl p-8 w-full max-w-md relative border border-white/50 animate-scale-in">
                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors" aria-label="Close modal">
                    <IconX className="h-6 w-6" />
                </button>
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-extrabold text-brand-dark-blue mb-2">Get a Free Quote</h2>
                    <p className="text-gray-600">Fill out the form below to request a free consultation.</p>
                </div>
                {/* Contact form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="modal-name"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-blue"
                            placeholder="Your Name"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            id="modal-email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-blue"
                            placeholder="Your Email"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="modal-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            id="modal-phone"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-blue"
                            placeholder="Your Phone Number"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-full hover:bg-brand-dark-blue transition-all duration-300 transform hover:scale-105"
                    >
                        Send Message
                    </button>
                    {/* Display form submission status */}
                    {formStatus && <p className="text-center text-green-700 bg-green-100 p-3 rounded-md mt-4">{formStatus}</p>}
                </form>
            </div>
        </div>
    );
};

export default ContactModal;
