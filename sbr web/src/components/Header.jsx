import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';


// --- SVG ICONS (Self-contained, no dependencies) ---
// These icons are specifically used within the Header component.
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IconPhone = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
const IconFacebook = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z" /></svg>;
const IconInstagram = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z" /></svg>;
const IconWhatsapp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.457l-6.354 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.06.098-1.165 4.253 4.356-1.141.108.063z" /></svg>;


// Header Component
const Header = ({ navLinks, productLinks, projectImages, openContactModal, handleNavigation }) => {
    const { user } = useAuth();
    const [navOpen, setNavOpen] = useState(false); // State for mobile navigation menu
    const [isScrolled, setIsScrolled] = useState(false); // State to track scroll position for header styling
    const [dropdownOpen, setDropdownOpen] = useState(false); // State for products dropdown menu

    // Effect to handle header styling on scroll
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const closeNav = () => setNavOpen(false); // Helper to close mobile nav

    return (
        <header className="w-full fixed top-0 left-0 z-50">
            {/* Top bar with special offer and contact info */}
            <div className={`bg-brand-blue text-white transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'}`}>
                <div className="container mx-auto px-6 h-10 flex justify-between items-center text-sm">
                    <div className="w-1/3 overflow-hidden hidden md:block">
                        <div className="ticker-text whitespace-nowrap">Special Offer: Get 15% off on all Solar Water Heaters this month!</div>
                    </div>
                    <div className="w-full md:w-1/3 flex-grow flex justify-center items-center">
                        <IconPhone className="h-4 w-4 mr-2" />
                        <a href="tel:+919848182595" className="hover:text-brand-yellow">+91 98481 82595</a>
                    </div>
                    <div className="w-1/3 hidden md:flex items-center justify-end space-x-4">
                        <a href="#" aria-label="Facebook" className="hover:text-brand-yellow"><IconFacebook className="h-5 w-5" /></a>
                        <a href="#" aria-label="Instagram" className="hover:text-brand-yellow"><IconInstagram className="h-5 w-5" /></a>
                    </div>
                </div>
            </div>

            {/* Main navigation bar */}
            <div className={`w-full transition-all duration-300 ${isScrolled ? 'bg-brand-blue shadow-lg' : 'bg-white'}`}>
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    {/* Logo */}
                    <a href="#" onClick={() => handleNavigation('home')}>
                        <img src="https://i.postimg.cc/qN2TPWPr/logo.png" alt="Sri Balaji Renewables Logo" className="h-12 transition-all duration-300" />
                    </a>

                    {/* Desktop navigation links */}
                    <ul className="hidden md:flex flex-grow justify-center items-center space-x-1">
                        {navLinks.map(item => (
                            <li key={item}>
                                <a href="#" onClick={() => handleNavigation(item.toLowerCase())} className={`font-semibold transition-all duration-300 transform active:scale-95 px-4 py-2 rounded-md ${isScrolled ? 'text-white hover:bg-brand-yellow hover:text-brand-dark-blue' : 'text-brand-dark-blue hover:bg-brand-yellow/20'}`}>
                                    {item}
                                </a>
                            </li>
                        ))}
                        {user && (
                            <li>
                                <a href="#" onClick={() => handleNavigation(`${user.role.toLowerCase()}-dashboard`)} className={`font-semibold transition-all duration-300 transform active:scale-95 px-4 py-2 rounded-md ${isScrolled ? 'text-white hover:bg-brand-yellow hover:text-brand-dark-blue' : 'text-brand-dark-blue hover:bg-brand-yellow/20'}`}>
                                    Dashboard
                                </a>
                            </li>
                        )}

                        {/* Products dropdown */}
                        <li onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)} className="relative">
                            {/* Main Products button - now navigates to 'products' page on click */}
                            <button onClick={() => handleNavigation('products')} className={`font-semibold transition-all duration-300 transform active:scale-95 px-4 py-2 rounded-md flex items-center ${isScrolled ? 'text-white hover:bg-brand-yellow hover:text-brand-dark-blue' : 'text-brand-dark-blue hover:bg-brand-yellow/20'}`}>
                                Products
                                <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[40rem] transition-all duration-300 ${dropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'}`}>
                                <div className="bg-white/90 backdrop-blur-lg shadow-2xl rounded-lg border border-gray-200 grid grid-cols-2">
                                    <div className="p-6 border-r border-gray-200">
                                        <h4 className="font-bold text-brand-dark-blue mb-4">Our Products</h4>
                                        <ul className="space-y-2">
                                            {/* Iterate over productLinks and use link.name for display, link.route for navigation */}
                                            {productLinks.map(link => (
                                                <li key={link.name}>
                                                    <a href="#" onClick={() => handleNavigation(link.route)} className="block text-brand-dark-blue font-medium hover:text-brand-blue hover:translate-x-1 transition-all">
                                                        {link.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <h4 className="font-bold text-brand-dark-blue mb-4">Featured Products</h4>
                                        {projectImages.map(img => <a href="#" key={img.alt} onClick={() => handleNavigation('products')} className="block group overflow-hidden rounded-md relative"><img src={img.src} alt={img.alt} className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300" /><div className="absolute inset-0 bg-black/40 flex items-end p-2"><p className="text-white font-semibold text-sm">{img.title}</p></div></a>)}
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>

                    {/* Desktop Contact Us button */}
                    <div className="hidden md:block">
                        <a href="#" onClick={openContactModal} className={`font-bold py-2 px-6 rounded-full transition-all duration-300 ${isScrolled ? 'bg-white text-brand-dark-blue hover:bg-brand-yellow' : 'bg-brand-blue text-white hover:bg-brand-dark-blue'}`}>
                            Contact Us
                        </a>
                    </div>

                    {/* Mobile menu and contact buttons */}
                    <div className="md:hidden flex items-center">
                        <button onClick={openContactModal} className={`p-2 rounded-full transition-all duration-300 ${isScrolled ? 'bg-white text-brand-dark-blue hover:bg-brand-yellow' : 'bg-brand-blue text-white hover:bg-brand-dark-blue'}`} aria-label="Contact Us">
                            <IconPhone className="h-6 w-6" />
                        </button>
                        <button onClick={() => setNavOpen(!navOpen)} className={`ml-4 ${isScrolled ? 'text-white' : 'text-brand-dark-blue'}`} aria-label="Toggle menu">
                            {navOpen ? <IconX /> : <IconMenu />}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile navigation menu (hidden by default, slides down) */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-brand-dark-blue shadow-lg transition-all duration-300 ease-in-out ${navOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
                <ul className="flex flex-col p-4">
                    {navLinks.map(item => (
                        <li key={item}>
                            <a href="#" onClick={() => { closeNav(); handleNavigation(item.toLowerCase()); }} className="block py-3 px-4 text-white font-medium hover:bg-brand-blue rounded-md active:bg-brand-blue">
                                {item}
                            </a>
                        </li>
                    ))}
                    {/* Mobile Products link - also navigates to 'products' page */}
                    <li key="products-mobile">
                        <a href="#" onClick={() => { closeNav(); handleNavigation('products'); }} className="block py-3 px-4 text-white font-medium hover:bg-brand-blue rounded-md active:bg-brand-blue">
                            Products
                        </a>
                    </li>
                    {user && (
                        <li key="portal-mobile">
                            <a href="#" onClick={() => { closeNav(); handleNavigation(`${user.role.toLowerCase()}-dashboard`); }} className="block py-3 px-4 text-white font-medium hover:bg-brand-blue rounded-md active:bg-brand-blue">
                                Dashboard
                            </a>
                        </li>
                    )}

                </ul>
            </div>
        </header>
    );
};

export default Header;
