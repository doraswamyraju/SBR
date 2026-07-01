import React, { useState } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
// These icons are specifically used within the Footer component.
const IconFacebook = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z" /></svg>;
const IconInstagram = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z" /></svg>;
const IconWhatsapp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.457l-6.354 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.06.098-1.165 4.253 4.356-1.141.108.063z" /></svg>;


// Footer Component
const Footer = ({ navLinks, handleNavigation }) => {
    const [formStatus, setFormStatus] = useState('');

    // Handles newsletter/quote form submission in the footer
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormStatus("Thank you for your message!"); // Set success message
        e.target.reset(); // Reset form fields
        setTimeout(() => setFormStatus(''), 5000); // Clear message after 5 seconds
    };

    return (
        <footer className="bg-brand-dark-blue text-white">
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Company Logo and Description */}
                    <div>
                        <img src="https://i.postimg.cc/qN2TPWPr/logo.png" alt="Sri Balaji Renewables Logo" className="h-12 mb-4" />
                        <p className="text-blue-200 text-sm leading-relaxed">Your trusted partner for a sustainable future in Tirupati since 1998. We provide top-quality solar and water solutions.</p>
                    </div>
                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            {navLinks.map(item => (
                                <li key={item}>
                                    <a href="#" onClick={() => handleNavigation(item.toLowerCase())} className="text-blue-200 hover:text-brand-yellow hover:translate-x-1 transition-all duration-300 block">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Get a Quick Quote Form */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Get a Quick Quote</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input type="email" name="email" placeholder="Your Email Address" className="w-full p-2 rounded-md bg-brand-blue border border-blue-700 text-white placeholder-blue-200 text-sm focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none" required />
                            <textarea name="message" placeholder="Your Message" rows="2" className="w-full p-2 rounded-md bg-brand-blue border border-blue-700 text-white placeholder-blue-200 text-sm focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none" required></textarea>
                            <button type="submit" className="w-full bg-brand-yellow text-brand-dark-blue font-bold py-2 rounded-md text-sm hover:bg-yellow-300 transition-colors">Send</button>
                            {formStatus && <p className="text-sm text-green-300">{formStatus}</p>}
                        </form>
                    </div>
                    {/* Follow Us Social Links & App Download */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Follow Us</h3>
                        <div className="flex space-x-4 mb-6">
                            <a href="#" aria-label="Facebook" className="text-blue-200 hover:text-brand-yellow transition-transform hover:scale-125"><IconFacebook className="h-6 w-6" /></a>
                            <a href="#" aria-label="Instagram" className="text-blue-200 hover:text-brand-yellow transition-transform hover:scale-125"><IconInstagram className="h-6 w-6" /></a>
                            <a href="#" aria-label="WhatsApp" className="text-blue-200 hover:text-brand-yellow transition-transform hover:scale-125"><IconWhatsapp className="h-6 w-6" /></a>
                        </div>
                        
                        <h3 className="font-bold text-md mb-4 text-white">Download Our Apps</h3>
                        <div className="flex flex-col gap-3">
                            {/* Google Play Store Badge */}
                            <a href="#" className="flex items-center bg-black/40 hover:bg-black/60 border border-blue-700/50 rounded-lg px-3 py-1.5 transition-colors w-44">
                                <svg className="w-5 h-5 mr-2 text-white fill-current" viewBox="0 0 24 24">
                                    <path d="M3.609 1.814L13.792 12 3.61 22.186A2.257 2.257 0 013 20.598V3.402c0-.66.223-1.246.609-1.588zm11.29 9.077l3.14-1.812a2.249 2.249 0 010 3.842l-3.14-1.812-.001.001-.001-.001-1.129-.652 1.13-.652.001-.009zm-1.821 1.761L3.924 22.002a2.185 2.185 0 001.328.498 2.25 2.25 0 001.558-.592l8.868-5.12-2.602-2.602-.001-.034zm0-1.304l2.602-2.602L6.81 3.126a2.25 2.25 0 00-1.558-.592 2.185 2.185 0 00-1.328.498l9.155 9.156v-.036z"/>
                                </svg>
                                <div className="text-left">
                                    <p className="text-[9px] text-blue-200 uppercase font-semibold leading-none">Get it on</p>
                                    <p className="text-xs text-white font-bold leading-tight mt-0.5">Google Play</p>
                                </div>
                            </a>
                            
                            {/* Apple App Store Badge */}
                            <a href="#" className="flex items-center bg-black/40 hover:bg-black/60 border border-blue-700/50 rounded-lg px-3 py-1.5 transition-colors w-44">
                                <svg className="w-5 h-5 mr-2 text-white fill-current" viewBox="0 0 24 24">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.96-1.4"/>
                                </svg>
                                <div className="text-left">
                                    <p className="text-[9px] text-blue-200 uppercase font-semibold leading-none">Download on the</p>
                                    <p className="text-xs text-white font-bold leading-tight mt-0.5">App Store</p>
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
            {/* Copyright information */}
            <div className="bg-black/20 py-4">
                <div className="container mx-auto px-6 text-center text-blue-300 text-sm">
                    <p>&copy; {new Date().getFullYear()} Sri Balaji Renewables. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
