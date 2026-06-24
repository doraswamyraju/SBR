import React, { useState } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
// This icon is specifically used within the TimedWelcomeModal.
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


// Timed Welcome Pop-up Modal Component
const TimedWelcomeModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({ firstName: '', email: '', phone: '' });
    const [formStatus, setFormStatus] = useState('');

    // Handles form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormStatus("Thank you! Your details have been submitted.");
        console.log("Timed Welcome Form Data Submitted:", formData); // Log form data for demonstration
        setFormData({ firstName: '', email: '', phone: '' }); // Clear form fields
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
            <div className="bg-blue-400 rounded-xl shadow-2xl p-8 w-full max-w-md relative border border-blue-300 animate-scale-in"
                 style={{ backgroundImage: `url(data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20V40zm20 0L40 20V0H20L0 20h20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)` }}>
                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors" aria-label="Close modal">
                    <IconX className="h-6 w-6" />
                </button>
                <div className="text-center mb-6 text-white">
                    <h2 className="text-3xl font-extrabold mb-2">Unlock 10% off!</h2>
                    <p className="text-blue-100">Join our email list so we can send you special offers and discounts.</p>
                </div>
                {/* Form for collecting user details */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="timed-firstName" className="block text-sm font-medium text-white mb-1">First name <span className="text-red-300">*</span></label>
                        <input
                            type="text"
                            id="timed-firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full p-3 rounded-md bg-white/20 text-white placeholder-blue-100 border-none focus:ring-2 focus:ring-yellow-300"
                            placeholder="First name"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="timed-email" className="block text-sm font-medium text-white mb-1">Email <span className="text-red-300">*</span></label>
                        <input
                            type="email"
                            id="timed-email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-3 rounded-md bg-white/20 text-white placeholder-blue-100 border-none focus:ring-2 focus:ring-yellow-300"
                            placeholder="Email"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="timed-phone" className="block text-sm font-medium text-white mb-1">Phone <span className="text-red-300">*</span></label>
                        <input
                            type="tel"
                            id="timed-phone"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-3 rounded-md bg-white/20 text-white placeholder-blue-100 border-none focus:ring-2 focus:ring-yellow-300"
                            placeholder="Mobile Number"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-white text-brand-blue font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                    >
                        Submit
                    </button>
                    {/* Display form submission status */}
                    {formStatus && <p className="text-center text-green-100 bg-green-600/50 p-3 rounded-md mt-4">{formStatus}</p>}
                </form>
            </div>
        </div>
    );
};

export default TimedWelcomeModal;
