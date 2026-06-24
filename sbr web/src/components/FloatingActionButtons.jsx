import React from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
// These icons are specifically used within the FloatingActionButtons component.
const IconRobot = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.05 7.44-7 7.93zM10 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>;
const IconWhatsapp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.457l-6.354 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.06.098-1.165 4.253 4.356-1.141.108.063z" /></svg>;
// New icon for scroll to top button
const IconArrowUp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;


// Floating Action Buttons Component
const FloatingActionButtons = ({ openContactModal, openChatbotModal }) => {
    const whatsappNumber = "919848182595"; // Replace with your actual WhatsApp number

    // Function to scroll to the top of the page
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scroll animation
        });
    };

    return (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-4 z-40">
            {/* Scroll to Top button */}
            <button
                onClick={scrollToTop}
                className="bg-brand-blue text-white p-4 rounded-full shadow-lg hover:bg-brand-dark-blue transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                aria-label="Scroll to top"
            >
                <IconArrowUp className="h-6 w-6" />
            </button>

            {/* Chatbot button */}
            <button
                onClick={openChatbotModal}
                className="bg-brand-blue text-white p-4 rounded-full shadow-lg hover:bg-brand-dark-blue transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                aria-label="Open Chatbot"
            >
                <IconRobot className="h-6 w-6" />
            </button>
            {/* WhatsApp chat link */}
            <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-yellow flex items-center justify-center"
                aria-label="Chat on WhatsApp"
            >
                <IconWhatsapp className="h-6 w-6" />
            </a>
        </div>
    );
};

export default FloatingActionButtons;
