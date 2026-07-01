import React, { useState, useEffect, useRef } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IconPhone = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
const IconFacebook = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z" /></svg>;
const IconInstagram = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z" /></svg>;
const IconWhatsapp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.457l-6.354 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.06.098-1.165 4.253 4.356-1.141.108.063z" /></svg>;
const IconPlay = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IconBuilding = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const IconWaterDrop = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const IconBolt = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconRestart = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 013.5 9" /></svg>;
const IconChevronDown = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const IconLocation = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const IconEmail = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>;
const IconMessage = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>;
const IconRobot = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.05 7.44-7 7.93zM10 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>;
const IconSend = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const IconAward = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;
const IconTarget = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0 7c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-17C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>;
const IconLightbulb = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.69 2 6 4.69 6 8c0 2.5 1.25 4.72 3.25 6.13.33.22.7.37 1.09.47.4.1.81.15 1.16.15.35 0 .76-.05 1.16-.15.39-.1.76-.25 1.09-.47C16.75 12.72 18 10.5 18 8c0-3.31-2.69-6-6-6zm0 14c-2.76 0-5-2.24-5-5V8c0-2.76 2.24-5 5-5s5 2.24 5 5v3c0 2.76-2.24 5-5 5z"/></svg>;
const IconCheckCircle = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.532-1.676-1.676a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
const IconStar = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" /></svg>;


// --- HELPER HOOKS & COMPONENTS ---
const useInView = (options) => {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.unobserve(entry.target);
            }
        }, options);
        const currentRef = ref.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, [ref, options]);
    return [ref, isInView];
};

const SectionTitle = ({ title, subtitle, isLight = false, isInView }) => (
    <div className={`text-center mb-12 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className={`text-3xl md:text-4xl font-bold ${isLight ? 'text-white text-shadow-lg' : 'text-brand-dark-blue'}`}>{title}</h2>
        <p className={`mt-2 max-w-2xl mx-auto ${isLight ? 'text-blue-200 text-shadow-md' : 'text-gray-600'}`}>{subtitle}</p>
        <div className="mt-4 w-24 h-1 bg-brand-yellow mx-auto"></div>
    </div>
);

const AnimatedSection = ({ id, className, children }) => {
    const [ref, isInView] = useInView({ threshold: 0.2, triggerOnce: true });
    return (
        <section
            id={id}
            ref={ref}
            className={`${className} transition-opacity duration-1000 ${isInView ? 'opacity-100' : 'opacity-0'}`}
        >
            {children}
        </section>
    );
};

// --- Google Reviews Section ---
const GoogleReviewsSection = () => {
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    const reviews = [
        { id: 1, author: "Suresh Kumar", rating: 5, comment: "Excellent service and high-quality solar water heater. Highly recommended for sustainable solutions!", date: "July 1, 2024" },
        { id: 2, author: "Priya Sharma", rating: 5, comment: "The water softener works wonders! No more hard water issues. Professional installation and great support.", date: "June 25, 2024" },
        { id: 3, author: "Rajesh V.", rating: 4, comment: "Good experience with the RO plant installation. Pure water and efficient service. A bit slow on initial response, but overall satisfied.", date: "June 18, 2024" },
        { id: 4, author: "Anitha Reddy", rating: 5, comment: "Very happy with the heat pump. Significant savings on electricity bills. Sri Balaji Renewables delivered on their promise.", date: "June 10, 2024" },
    ];

    const renderStars = (rating) => {
        return (
            <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                    <IconStar key={i} className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                ))}
            </div>
        );
    };

    return (
        <section id="reviews" ref={ref} className="py-16 bg-brand-light-blue decorated-background">
            <div className="container mx-auto px-6">
                <SectionTitle title="What Our Clients Say" subtitle="Hear from our satisfied customers about their experience with Sri Balaji Renewables." isInView={isInView} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {reviews.map((review, index) => (
                        <div key={review.id} className={`bg-white/60 backdrop-blur-lg rounded-xl shadow-lg p-6 text-center border border-white/50 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                            {renderStars(review.rating)}
                            <p className="text-gray-700 text-md italic mb-4">"{review.comment}"</p>
                            <p className="font-semibold text-brand-dark-blue">{review.author}</p>
                            <p className="text-gray-500 text-sm">{review.date}</p>
                        </div>
                    ))}
                </div>
                <div className={`text-center mt-12 transition-all duration-700 delay-500 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <a href="https://www.google.com/search?q=Sri+Balaji+Renewables+reviews" target="_blank" rel="noopener noreferrer" className="bg-brand-yellow text-brand-dark-blue font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-500 transition duration-300 transform hover:scale-105 shadow-lg">
                        Read More Reviews on Google
                    </a>
                </div>
            </div>
        </section>
    );
};

// --- Loyal Customers Section ---
const LoyalCustomersSection = ({ clientsData }) => {
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    return (
        <section id="loyal-customers" ref={ref} className="py-16 bg-white decorated-background">
            <div className={`container mx-auto px-6 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <SectionTitle title="Our Esteemed Clients" subtitle="Trusted by leading institutions and businesses in Tirupati." isInView={isInView} />
                <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                    <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
                        {clientsData.map(client => (<li key={client.id}><img src={client.logo} alt={client.name} className="h-12 md:h-16 object-contain grayscale hover:grayscale-0 transition-all duration-300" /></li>))}
                    </ul>
                    <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
                        {clientsData.map(client => (<li key={client.id + '-clone'}><img src={client.logo} alt={client.name} className="h-12 md:h-16 object-contain grayscale hover:grayscale-0 transition-all duration-300" /></li>))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

// --- Product Image Gallery ---
const ProductImageGallery = ({ images }) => {
    const [selectedImg, setSelectedImg] = useState(null);
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });

    return (
        <>
            <section ref={ref} className="py-16 bg-brand-light-blue decorated-background parallax-bg" style={{ backgroundImage: `url(https://placehold.co/1920x800/00529B/FFC107?text=Gallery+Background)` }}>
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative z-10 container mx-auto px-6">
                    <SectionTitle title="Product Gallery" subtitle="See our Scalenors in action and their meticulous design." isLight={true} isInView={isInView} />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((img, index) => (
                            <div key={index} className={`relative overflow-hidden rounded-lg shadow-lg cursor-pointer group transition-all duration-700 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ transitionDelay: `${index * 70}ms` }} onClick={() => setSelectedImg(img.src)}>
                                <img src={img.src} alt={img.alt} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/CCCCCC/333333?text=${img.alt.replace(/\s/g, '+')}`; }} />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-white text-lg font-bold">View</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {selectedImg && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedImg(null)}>
                    <button className="absolute top-6 right-6 text-white hover:text-brand-yellow transition-colors" aria-label="Close image modal">
                        <IconX className="h-8 w-8" />
                    </button>
                    <img src={selectedImg} alt="Enlarged product image" className="max-w-[90%] max-h-[80%] object-contain rounded-lg" />
                </div>
            )}
        </>
    );
};

// --- Scalenors vs. Softeners Comparison Section ---
const ScalenorVsSoftenerSection = () => {
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    return (
        <section ref={ref} className="py-16 bg-white decorated-background">
            <div className="container mx-auto px-6">
                <SectionTitle title="Scalenors vs. Softeners: What's the Difference?" subtitle="Understand which solution is right for your hard water challenges." isInView={isInView} />
                <div className={`bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 border border-white/50 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-gray-700">
                        <div>
                            <h3 className="text-2xl font-bold text-brand-dark-blue mb-4">HM Hard Water Scalenors</h3>
                            <ul className="list-disc list-inside space-y-3 text-lg">
                                <li className="hover:text-brand-blue transition-colors">**Prevents Scale Formation:** Conditions water to prevent calcium and magnesium from adhering to surfaces.</li>
                                <li className="hover:text-brand-blue transition-colors">**No Salt or Chemicals:** Operates using an electrolysis process, eliminating the need for salt or chemical regeneration.</li>
                                <li className="hover:text-brand-blue transition-colors">**Zero Water Wastage:** No backwashing or wastewater discharge, making it eco-friendly.</li>
                                <li className="hover:text-brand-blue transition-colors">**Maintenance-Free:** Requires only periodic rinsing with water.</li>
                                <li className="hover:text-brand-blue transition-colors">**Retains Healthy Minerals:** Does not remove beneficial minerals from water.</li>
                                <li className="hover:text-brand-blue transition-colors">**Ideal for:** Protecting appliances, plumbing, and improving water flow without altering water chemistry.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-brand-dark-blue mb-4">Traditional Water Softeners</h3>
                            <ul className="list-disc list-inside space-y-3 text-lg">
                                <li className="hover:text-brand-blue transition-colors">**Removes Hardness Minerals:** Uses ion exchange to replace calcium and magnesium with sodium ions.</li>
                                <li className="hover:text-brand-blue transition-colors">**Requires Salt:** Needs regular replenishment of salt for regeneration.</li>
                                <li className="hover:text-brand-blue transition-colors">**Generates Wastewater:** Produces brine discharge during the regeneration cycle.</li>
                                <li className="hover:text-brand-blue transition-colors">**Requires Maintenance:** Involves salt refills and periodic servicing.</li>
                                <li className="hover:text-brand-blue transition-colors">**Changes Water Chemistry:** Increases sodium content in water.</li>
                                <li className="hover:text-brand-blue transition-colors">**Ideal for:** Achieving "soft" feel in water, reducing soap scum, and protecting certain appliances.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-gray-600 italic">
                        <p>Choosing between a Scalenor and a Softener depends on your specific needs and priorities. Contact us for a personalized recommendation!</p>
                    </div>
                </div>
            </div >
        </section >
    );
};

// --- Testimonial Videos Section ---
const TestimonialVideosSection = () => {
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    const testimonials = [
        { id: 1, title: "Scalenor Review: Amazing Results!", embedUrl: "https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8c_gX_c4Y2T-72i89rT-6-F" }, // Sample YouTube Embed URL
        { id: 2, title: "Happy Customer: No More Hard Water!", embedUrl: "https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8c_gX_c4Y2T-72i89rT-6-F" },
        { id: 3, title: "Savings with Sri Balaji Renewables", embedUrl: "https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8c_gX_c4Y2T-72i89rT-6-F" },
    ];

    return (
        <section ref={ref} className="py-16 bg-brand-dark-blue parallax-bg" style={{ backgroundImage: `url(https://placehold.co/1920x800/002D5B/FFC107?text=Testimonials+Background)` }}>
            <div className="absolute inset-0 bg-black/70"></div>
            <div className="relative z-10 container mx-auto px-6 text-white">
                <SectionTitle title="Video Testimonials" subtitle="Hear directly from our satisfied customers." isLight={true} isInView={isInView} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((video, index) => (
                        <div key={video.id} className={`bg-white/10 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all duration-700 hover:shadow-2xl hover:scale-105 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                            <div className="aspect-video w-full">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={video.embedUrl}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-white">{video.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};


// --- HOMEPAGE COMPONENTS ---
const HeroSlider = ({ heroSlides, productLinks, handleNavigation }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 7000);
        return () => clearInterval(timer);
    }, [heroSlides.length]);

    return (
        <section id="home" className="relative h-[90vh] w-full overflow-hidden">
            {heroSlides.map((slide, index) => (
                <div key={slide.id} className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${slide.bgImage})` }}>
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>
            ))}
            <div className="relative h-full container mx-auto px-6 flex items-center">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-white">
                        <h1 className="text-4xl lg:text-6xl font-extrabold text-shadow-lg mb-4">{heroSlides[currentSlide].title}</h1>
                        <p className="text-lg lg:text-xl text-blue-100 text-shadow-md mb-8">{heroSlides[currentSlide].subtitle}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-white/20">
                        <h3 className="text-2xl font-bold text-white mb-4 text-center">Request a Free Quote</h3>
                        <form>
                            <div className="mb-4"><input type="text" placeholder="Your Name" className="w-full p-3 rounded-md bg-white/20 text-white placeholder-gray-300 border-none focus:ring-2 focus:ring-brand-yellow" /></div>
                            <div className="mb-4"><input type="tel" placeholder="Your Phone Number" className="w-full p-3 rounded-md bg-white/20 text-white placeholder-gray-300 border-none focus:ring-2 focus:ring-brand-yellow" /></div>
                            <div className="mb-4"><select className="w-full p-3 rounded-md bg-white/20 text-white border-none focus:ring-2 focus:ring-brand-yellow appearance-none"><option className="text-black">Select a Product</option>{productLinks.map(product => (<option key={product} value={product} className="text-black">{product}</option>))}</select></div>
                            <button type="submit" className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-brand-dark-blue font-bold py-3 px-6 rounded-md hover:from-yellow-500 hover:to-yellow-500 transition duration-300 transform hover:scale-105">Submit Now</button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">{heroSlides.map((_, index) => (<button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-brand-yellow scale-125' : 'bg-white/50'}`}></button>))}</div>
        </section>
    );
};

const ProductsSection = ({ productsData, handleNavigation }) => {
    const [ref, isInView] = useInView({ threshold: 0.2, triggerOnce: true });
    const getAnimationClasses = (index, inView) => {
        const baseClasses = 'transition-all duration-700 ease-out';
        if (inView) return `${baseClasses} opacity-100 translate-y-0 translate-x-0`;
        switch (index % 4) {
            case 0: return `${baseClasses} opacity-0 -translate-x-12 -translate-y-12`;
            case 1: return `${baseClasses} opacity-0 translate-x-12 -translate-y-12`;
            case 2: return `${baseClasses} opacity-0 -translate-x-12 translate-y-12`;
            case 3: return `${baseClasses} opacity-0 translate-x-12 translate-y-12`;
            default: return `${baseClasses} opacity-0`;
        }
    };
    return (
        <section id="products" ref={ref} className="py-20 bg-brand-light-blue decorated-background overflow-hidden">
            <div className="container mx-auto px-6">
                <SectionTitle title="Our Core Products" subtitle="Delivering excellence with industry-leading renewable energy and water solutions." isInView={isInView} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {productsData.map((product, index) => (
                        <div key={product.id} className={getAnimationClasses(index, isInView)} style={{ transitionDelay: `${index * 100}ms` }}>
                            <div className="bg-white/60 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden group text-center h-full flex flex-col border border-white/50 hover:shadow-2xl hover:border-brand-yellow transition-all duration-300 transform hover:-translate-y-2">
                                <div className="p-4 bg-white"><img src={product.image} alt={product.name} className="w-full h-48 object-contain" /></div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="text-xl font-bold text-brand-dark-blue mb-2">{product.name}</h3>
                                    <p className="text-gray-600 flex-grow">{product.description}</p>
                                    <a href="#" onClick={() => handleNavigation('product-scalenor')} className="mt-4 inline-block bg-brand-blue text-white font-semibold py-2 px-6 rounded-full hover:bg-brand-dark-blue transition-all duration-300">Know More</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={`text-center transition-all duration-700 delay-500 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}><a href="#" onClick={() => handleNavigation('products')} className="bg-brand-yellow text-brand-dark-blue font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-500 transition duration-300 transform hover:scale-105 shadow-lg">View All Products</a></div>
            </div>
        </section>
    );
};

const SingleProductFeature = ({ handleNavigation }) => {
    const videoId = "f9LEFs1cL_w";
    const videoThumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const [ref, isInView] = useInView({ threshold: 0.3, triggerOnce: true });

    return (
        <section ref={ref} id="product-scalenor-home" className={`h-screen w-full flex items-center justify-center p-4 decorated-background overflow-hidden ${isInView ? 'is-visible' : ''}`}>
            <div className={`w-full max-w-6xl h-auto bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl transition-all duration-1000 ease-out group ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <div className="p-6 border-b border-white/50">
                    <h2 className={`text-center text-2xl md:text-4xl font-extrabold text-brand-dark-blue tracking-tight transition-all duration-700 ease-out delay-200 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}><span className="title-gradient-text">MAINTENANCE FREE HM HARD WATER SCALENOR</span></h2>
                </div>
                <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className={`md:w-1/2 w-full transition-all duration-1000 ease-in-out delay-500 ${isInView ? 'opacity-100 md:translate-x-0' : 'opacity-0 md:translate-x-1/2'}`}>
                        <a href={`https://www.youtube.com/shorts/${videoId}`} target="_blank" rel="noopener noreferrer" className="block relative rounded-lg shadow-2xl overflow-hidden aspect-video group/video">
                            <img src={videoThumbnail} alt="HM Hard Water Scalenor Video Thumbnail" className="w-full h-full object-cover transition-transform duration-300 group-hover/video:scale-110" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300 group-hover/video:bg-black/20"><div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/video:scale-110 transition-transform"><IconPlay /></div></div>
                        </a>
                    </div>
                    <div className={`md:w-1/2 w-full transition-all duration-1000 ease-in-out delay-500 ${isInView ? 'opacity-100 md:translate-x-0' : 'opacity-0 md:-translate-x-1/2'}`}>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-700 mb-6"><span className="gradient-text-underline">HM hard water scalenors</span></h3>
                            <div className="text-gray-600 space-y-4 leading-relaxed font-serif-body text-lg">
                                <p>The Maintenance-Free HM Hard Water Scalenor collects 70% of calcium & magnesium (scaling/salt) before it even enters your overhead tank. It's a completely maintenance-free and chemical-free process.</p>
                                <p>It’s eco-friendly with no water wastage and works using an electrolysis process. The unit can be cleaned without any chemicals or salt—just with water—every 1-3 months based on usage. It is suitable for installation in both residential and commercial spaces.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <a href="#" onClick={() => handleNavigation('product-scalenor')} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-full text-center hover:bg-brand-dark-blue transition-all duration-300 transform hover:scale-105 hover:shadow-lg">See More</a>
                                <a href="/blog/why-scalenors" className="bg-transparent border-2 border-brand-blue text-brand-blue font-bold py-3 px-8 rounded-full text-center hover:bg-brand-blue hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg">Why Scalenors</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ProductAssistant = ({ questions, recommendations }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [recommendation, setRecommendation] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const handleAnswer = (answerKey) => {
        setIsExiting(true);
        setTimeout(() => {
            const newAnswers = [...answers, answerKey];
            setAnswers(newAnswers);
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                const recommendationKey = newAnswers.join('_');
                setRecommendation(recommendations[recommendationKey] || recommendations["home_water_small"]);
                setIsFinished(true);
            }
            setIsExiting(false);
        }, 300);
    };

    const handleRestart = () => {
        setIsExiting(true);
        setTimeout(() => {
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setRecommendation(null);
            setIsFinished(false);
            setIsExiting(false);
        }, 300);
    };
    
    const progressPercentage = isFinished ? 100 : (currentQuestionIndex / questions.length) * 100;

    return (
        <AnimatedSection id="assistant" className="py-20 flex items-center bg-brand-light-blue decorated-background">
            <div className="container mx-auto px-6">
                <div className="w-full max-w-4xl mx-auto bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-8 transition-all duration-300">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8"><div className="bg-brand-yellow h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div></div>
                    <div className={`transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                        {!isFinished ? (
                            <div>
                                <div className="text-center mb-8">
                                    <p className="text-brand-blue font-semibold">Step {currentQuestionIndex + 1} of {questions.length}</p>
                                    <h2 className="text-2xl md:text-3xl font-bold text-brand-dark-blue mt-2">{questions[currentQuestionIndex].question}</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {questions[currentQuestionIndex].answers.map(answer => (
                                        <button key={answer.key} onClick={() => handleAnswer(answer.key)} className="bg-white/80 p-6 rounded-lg shadow-md border-2 border-transparent hover:border-brand-yellow hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                                            <div className="flex items-center">
                                                <div className="text-brand-blue bg-brand-light-blue p-3 rounded-full mr-4 transition-colors group-hover:bg-brand-yellow group-hover:text-brand-dark-blue">{answer.icon}</div>
                                                <span className="text-lg font-semibold text-brand-dark-blue">{answer.text}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-brand-dark-blue">We Recommend</h2>
                                <p className="text-gray-600 mt-2 mb-6">Based on your answers, here is the best product for you.</p>
                                <div className="bg-white rounded-lg shadow-xl p-8 inline-flex flex-col items-center">
                                    <img src={recommendation.image} alt={recommendation.name} className="w-48 h-48 object-cover rounded-lg mb-4" />
                                    <h3 className="text-2xl font-bold text-brand-dark-blue">{recommendation.name}</h3>
                                    <a href="#" className="mt-6 bg-brand-blue text-white font-bold py-3 px-8 rounded-full hover:bg-brand-dark-blue transition-all">View Product Details</a>
                                </div>
                                <button onClick={handleRestart} className="mt-8 flex items-center mx-auto text-gray-600 hover:text-brand-blue font-semibold"><IconRestart />Start Over</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
};

const GallerySection = ({ galleryLogos }) => {
    const [selectedImg, setSelectedImg] = useState(null);
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    return (
        <>
            <section id="gallery" ref={ref} className="w-screen relative left-1/2 -translate-x-1/2 py-24 overflow-hidden bg-fixed bg-cover bg-center">
                   <div className="absolute inset-0 bg-gradient-to-b from-brand-dark-blue/90 to-brand-blue/90"></div>
                   <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(https://i.postimg.cc/w7NL183Z/image.png)`, opacity: 0.5 }}></div>
                <div className="relative z-10 container mx-auto px-6">
                    <SectionTitle title="Our Gallery of Excellence" subtitle="A showcase of our valued clients and partners who trust Sri Balaji Renewables." isLight={true} isInView={isInView} />
                    <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_15%,_black_85%,transparent_100%)]">
                        <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
                            {galleryLogos.map(client => (<li key={client.id} onClick={() => setSelectedImg(client.logo)} className="cursor-pointer"><img src={client.logo} alt={client.name} className="h-20 md:h-24 object-contain transition-all duration-300 hover:scale-110 hover:drop-shadow-lg" /></li>))}
                        </ul>
                        <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
                            {galleryLogos.map(client => (<li key={`${client.id}-clone`} onClick={() => setSelectedImg(client.logo)} className="cursor-pointer"><img src={client.logo} alt={client.name} className="h-20 md:h-24 object-contain transition-all duration-300 hover:scale-110 hover:drop-shadow-lg" /></li>))}
                        </ul>
                    </div>
                </div>
            </section>
            {selectedImg && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedImg(null)}><button className="absolute top-6 right-6 text-white hover:text-brand-yellow transition-colors" aria-label="Close image modal"><IconX /></button><img src={selectedImg} alt="Enlarged client logo" className="max-w-[90%] max-h-[80%] object-contain rounded-lg" /></div>)}
        </>
    );
};

const FaqSection = ({ faqData }) => {
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    const [activeTab, setActiveTab] = useState(Object.keys(faqData)[0]);
    const [openIndex, setOpenIndex] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleTabClick = (tabName) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setActiveTab(tabName);
            setOpenIndex(null);
            setIsTransitioning(false);
        }, 200);
    };

    return (
        <section id="faq" ref={ref} className={`py-6 bg-brand-light-blue decorated-background`}>
            <div className="container mx-auto px-6">
                <SectionTitle title="Frequently Asked Questions" subtitle="Have questions? We have answers. Find solutions to common inquiries below." isInView={isInView} />
                <div className={`w-full max-w-4xl mx-auto bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-4 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex border-b border-gray-200 mb-2">
                        {Object.keys(faqData).map(tabName => (<button key={tabName} onClick={() => handleTabClick(tabName)} className={`py-3 px-6 font-semibold text-lg transition-colors duration-300 border-b-4 ${activeTab === tabName ? 'text-brand-blue border-brand-yellow' : 'text-gray-500 border-transparent hover:text-brand-blue'}`}>{tabName}</button>))}
                    </div>
                    <div className={`max-h-96 overflow-y-auto custom-scrollbar transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="space-y-2">
                            {faqData[activeTab].map((faq, index) => (<div className="border-b border-brand-blue/20" key={index}><button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex justify-between items-center text-left py-4 px-6 hover:bg-gray-100 transition-colors rounded-md"><span className="font-semibold text-lg text-brand-dark-blue">{faq.question}</span><IconChevronDown className={`w-6 h-6 text-brand-blue transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} /></button><div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}><div className="p-6 pt-0 text-gray-600">{faq.answer}</div></div></div>))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ContactSection = () => {
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
    const [formStatus, setFormStatus] = useState({ submitted: false, message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormStatus({ submitted: true, message: "Thank you! Your message has been sent." });
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setFormStatus({ submitted: false, message: '' }), 5000);
    };

    return (
        <section id="contact" ref={ref} className={`py-6 bg-brand-light-blue decorated-background`}>
            <div className="container mx-auto px-6">
                <SectionTitle title="Get In Touch" subtitle="We're here to help. Reach out to us for a free consultation or any inquiries." isInView={isInView} />
                <div className={`w-full max-w-6xl mx-auto bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-12 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex flex-col space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-brand-dark-blue mb-4">Contact Information</h3>
                            <div className="space-y-4 text-gray-700">
                                <p className="flex items-start"><IconLocation className="h-6 w-6 text-brand-blue mt-1 mr-4 flex-shrink-0" /> #18-1-6/E, Beside Ramanaidu Kalyana Mandapam, Tirumala Bye Pass Road, Tirupati - 517501, A.P.</p>
                                <p className="flex items-center"><IconPhone className="h-6 w-6 text-brand-blue mr-4" /> <a href="tel:+919848182595" className="hover:text-brand-blue">+91 98481 82595</a></p>
                                <p className="flex items-center"><IconEmail className="h-6 w-6 text-brand-blue mr-4" /> <a href="mailto:info@sribalajirenewables.com" className="hover:text-brand-blue">info@sribalajirenewables.com</a></p>
                            </div>
                        </div>
                        <div className="flex-grow"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.608386341496!2d79.40043867580661!3d13.679758986707328!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d4b0f0b4d4b1f%3A0x8e8e8e8e8e8e8e8e!2sSri%20Balaji%20Renewables!5e0!3m2!1sen!2sin!4v1672345678901!5m2!1sen!2sin" width="100%" height="100%" style={{ border: 0, minHeight: '250px' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-lg shadow-md" title="Sri Balaji Renewables Location"></iframe></div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-brand-dark-blue mb-4">Send Us a Message</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-blue" required /></div>
                            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" id="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-blue" required /></div>
                            <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-blue" /></div>
                            <div><label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea id="message" name="message" rows="4" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-blue" required></textarea></div>
                            <div><button type="submit" className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-full hover:bg-brand-dark-blue transition-all duration-300 transform hover:scale-105">Send Message</button></div>
                            {formStatus.submitted && (<p className="text-center text-green-700 bg-green-100 p-3 rounded-md">{formStatus.message}</p>)}
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
const BlogSection = ({ blogPostsData, handleNavigation }) => {
    const [ref, isInView] = useInView({ threshold: 0.2, triggerOnce: true });

    if (!blogPostsData || blogPostsData.length === 0) return null;

    const mainPost = blogPostsData[0];
    const otherPosts = blogPostsData.slice(1, 3); // limit to 2 other posts to keep layout neat

    return (
        <section ref={ref} id="blog" className="py-20 bg-brand-light-blue decorated-background overflow-hidden">
            <div className="container mx-auto px-6">
                <SectionTitle title="From Our Blog" subtitle="Stay updated with the latest news, tips, and insights on renewable solutions." isInView={isInView} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    <div className={`lg:row-span-2 transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                           <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('blog-' + mainPost.slug); }} className="block bg-white/60 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden group h-full border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="relative overflow-hidden">
                                <img src={mainPost.image} alt={mainPost.title} className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent"><p className="text-sm font-semibold text-brand-yellow">{mainPost.category}</p></div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-2xl font-bold text-brand-dark-blue group-hover:text-brand-blue transition-colors duration-300 mb-4">{mainPost.title}</h3>
                                <p className="text-gray-600 text-sm mb-4">{mainPost.summary || `By ${mainPost.author}`}</p>
                                <span className="mt-auto inline-block font-semibold text-brand-blue group-hover:text-brand-dark-blue group-hover:text-shadow-yellow transition-all">Read More &rarr;</span>
                            </div>
                        </a>
                    </div>
                    {otherPosts.map((post, index) => (
                        <div key={post._id || post.id} className={`transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: `${(index + 1) * 150}ms` }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('blog-' + post.slug); }} className="block bg-white/60 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden group h-full border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                <div className="relative overflow-hidden">
                                    <img src={post.image} alt={post.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                                      <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/60 to-transparent"><p className="text-xs font-semibold text-brand-yellow">{post.category}</p></div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-brand-dark-blue group-hover:text-brand-blue transition-colors duration-300 mb-2">{post.title}</h3>
                                    <p className="text-gray-500 text-xs mb-2">{post.summary || `By ${post.author}`}</p>
                                    <span className="mt-2 inline-block font-semibold text-sm text-brand-blue group-hover:text-brand-dark-blue group-hover:text-shadow-yellow transition-all">Read More &rarr;</span>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};


// --- HOMEPAGE COMPONENT ---
const HomePage = ({ blogs, handleNavigation }) => {
    // --- Data for HomePage ---
    const productLinksData = ["Water Scalenors", "Water Softeners", "Solar Water Heaters", "RO Water Plant", "Domestic RO Purifier", "Solar Power Systems", "Fenice Solar Energy", "Heat Pumps"];
    const heroSlidesData = [
        { id: 1, title: "Maintenance-Free Water Scalenors", subtitle: "Our advanced HM Hard Water Scalenors prevent limescale buildup, protecting your pipes and appliances without chemicals or maintenance.", bgImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1920&q=80" },
        { id: 2, title: "High-Efficiency Heat Pumps", subtitle: "Experience energy-efficient water heating with our state-of-the-art Heat Pumps, providing reliable hot water while reducing your electricity bills.", bgImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80" },
        { id: 3, title: "Automatic Water Softeners", subtitle: "Enjoy the benefits of soft water. Our automatic systems remove hardness, leading to better skin, shinier hair, and longer-lasting appliances.", bgImage: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1920&q=80" },
        { id: 4, title: "Commercial & Domestic RO Plants", subtitle: "Get pure, safe drinking water with our custom-designed RO Water Plants, built for both residential and large-scale commercial needs.", bgImage: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=1920&q=80" },
        { id: 5, title: "SPC Solar Water Heaters", subtitle: "Enjoy 24/7 hot water with our high-efficiency solar water heating systems, backed by a 5-year replacement guarantee.", bgImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1920&q=80" }
    ];
    const productsPageData = [ // Used for homepage product display
        { id: 'p1', name: "Solar Water Heaters", description: "Harness the power of the sun for efficient, eco-friendly hot water.", image: "https://i.postimg.cc/CZp2b16T/solar-water-heater.png" },
        { id: 'p2', name: "HM Water Scalenors", description: "Protect your pipes and appliances with our maintenance-free scalenor.", image: "https://i.postimg.cc/sQDwJZY8/scalenor.png" },
        { id: 'p3', name: "Automatic Water Softeners", description: "Experience the luxury of soft water for healthier skin and hair.", image: "https://i.postimg.cc/BPjpr9wB/softener.png" },
        { id: 'p4', name: "RO Water Plants", description: "Ensure pure and safe drinking water for your home or business.", image: "https://i.postimg.cc/G4ZpYZDT/ro-plant.png" },
    ];
    const galleryLogosData = [
        { id: 'c1', name: "S.V. College of Engineering", logo: "https://i.postimg.cc/LhHjn12K/1704565987677-e-2147483647-v-beta-t-xl-Za-Kc-Ec-URa-JGjugiqh-NKL7ov-QC7ai-Rb-m-Fnm3-JAl0k.webp" },
        { id: 'c2', name: "Minerva Grand Hotels", logo: "https://i.postimg.cc/xJPH60G4/512x512bb.webp" },
        { id: 'c3', name: "Annapoorna Hotel", logo: "https://i.postimg.cc/fSTdF6BT/annapoorna-hotel-mailam-tindivanam-caterers-tnncec95ph-jpg-clr.webp" },
        { id: 'c4', name: "Bhimas Hotels", logo: "https://i.postimg.cc/qgjynvvt/download.webp" },
        { id: 'c5', name: "Hotel Bhimas", logo: "https://i.postimg.cc/3dNpZQkt/hotel-bhimas-logo.webp" },
    ];
    const faqPageData = {
        "Solar Products": [
            { question: "What are the benefits of installing a solar water heater?", answer: "Solar water heaters significantly reduce your electricity bills by using free energy from the sun. They are eco-friendly, have a long lifespan, and require minimal maintenance, providing you with hot water year-round." },
            { question: "How much can I save with a solar power system?", answer: "Savings vary based on your electricity consumption and the size of the system. However, many of our residential customers see a reduction of up to 90% in their monthly electricity bills." },
        ],
        "Water Products": [
            { question: "How does a water softener work?", answer: "A water softener works through a process called ion exchange. It removes hardness-causing minerals like calcium and magnesium from your water, replacing them with sodium ions." },
            { question: "Is a water scalenor different from a softener?", answer: "No, it's a water conditioner. While a softener removes hard minerals, our HM Water Scalenor uses an electrolysis process to condition the water, preventing minerals from forming scale, thus protecting your plumbing and appliances without removing essential minerals." },
        ]
    };
    const questionsData = [
        { id: 1, question: "Where do you want to install the product?", answers: [ { text: "Home", icon: <IconHome />, key: "home" }, { text: "Office / Commercial", icon: <IconBuilding />, key: "commercial" } ] },
        { id: 2, question: "What is your primary requirement?", answers: [ { text: "Water Solution", icon: <IconWaterDrop />, key: "water" }, { text: "Energy Solution", icon: <IconBolt />, key: "energy" } ] },
        { id: 3, question: "What is the size of your family or team?", answers: [ { text: "1 - 4 Members", icon: <IconUser />, key: "small" }, { text: "5+ Members", icon: <IconUsers />, key: "large" } ] }
    ];
    const recommendationsData = {
        "home_water_small": { name: "Domestic RO Purifier", image: "https://placehold.co/400x300/00529B/FFFFFF?text=RO+Purifier" },
        "home_water_large": { name: "Automatic Water Softener", image: "https://i.postimg.cc/BPjpr9wB/softener.png" },
        "home_energy_small": { name: "Solar Water Heater", image: "https://i.postimg.cc/CZp2b16T/solar-water-heater.png" },
        "home_energy_large": { name: "Solar Power System", image: "https://placehold.co/400x300/002D5B/FFC107?text=Solar+System" },
        "commercial_water_small": { name: "Water Scalenor", image: "https://i.postimg.cc/sQDwJZY8/scalenor.png" },
        "commercial_water_large": { name: "Commercial RO Plant", image: "https://placehold.co/400x300/00529B/FFFFFF?text=RO+Plant" },
        "commercial_energy_small": { name: "Heat Pump", image: "https://placehold.co/400x300/002D5B/FFC107?text=Heat+Pump" },
        "commercial_energy_large": { name: "Fenice Solar Energy System", image: "https://placehold.co/400x300/002D5B/FFC107?text=Fenice+Solar" },
    };
    const blogPostsData = [
        { id: 'b1', category: "Solar Power", title: "5 Signs It's Time to Switch to a Solar Water Heater", image: "https://i.postimg.cc/CZp2b16T/solar-water-heater.png", author: "John Doe", date: "July 22, 2025" },
        { id: 'b2', category: "Water Purification", title: "Understanding Hard Water vs. Soft Water", image: "https://i.postimg.cc/BPjpr9wB/softener.png", author: "Jane Smith", date: "July 18, 2025" },
        { id: 'b3', category: "Energy Savings", title: "The Benefits of a Maintenance-Free Scalenor", image: "https://i.postimg.cc/sQDwJZY8/scalenor.png", author: "Peter Jones", date: "July 15, 2025" },
    ];

    const activeBlogs = blogs && blogs.length > 0 ? blogs : blogPostsData;

    return (
        <>
            <HeroSlider heroSlides={heroSlidesData} productLinks={productLinksData} handleNavigation={handleNavigation} />
            <ProductsSection productsData={productsPageData} handleNavigation={handleNavigation} />
            <SingleProductFeature handleNavigation={handleNavigation} />
            <ProductAssistant questions={questionsData} recommendations={recommendationsData} />
            <LoyalCustomersSection clientsData={galleryLogosData} />
            <GallerySection galleryLogos={galleryLogosData} />
            <FaqSection faqData={faqPageData} />
            <ContactSection />
            <BlogSection blogPostsData={activeBlogs} handleNavigation={handleNavigation} />
        </>
    );
};

export default HomePage;
