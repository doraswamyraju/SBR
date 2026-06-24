import React, { useState, useEffect, useRef } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
const IconCheckCircle = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.532-1.676-1.676a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
const IconChevronDown = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const IconStar = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" /></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


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

// --- Google Reviews Section (re-included for self-containment) ---
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

// --- Loyal Customers Section (re-included for self-containment) ---
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

// --- Product Image Gallery (re-included for self-containment) ---
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

// --- Scalenors vs. Softeners Comparison Section (re-included for self-containment) ---
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

// --- Testimonial Videos Section (re-included for self-containment) ---
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


// --- PRODUCT SCALENOR PAGE COMPONENT ---
const ProductScalenorPage = ({ openContactModal }) => {
    // --- Single Product Page Specific Data (Water Scalenors) ---
    const singleProductData = {
        name: "HM Hard Water Scalenors",
        tagline: "The Maintenance-Free Solution for Limescale Prevention",
        mainImage: "https://i.postimg.cc/sQDwJZY8/scalenor.png", // Existing Scalenor image
        videoUrl: "https://www.youtube.com/embed/f9LEFs1cL_w", // Embed URL for YouTube
        overview: [
            "Our advanced HM Hard Water Scalenors are engineered to provide a revolutionary solution to hard water problems without the need for chemicals, salt, or extensive maintenance. Designed for both residential and commercial applications, these units actively prevent the buildup of limescale (calcium and magnesium) by over 70% before it even enters your overhead tank.",
            "This innovative system operates on an electrolysis process, effectively conditioning water to keep minerals suspended, rather than allowing them to adhere to surfaces. The result is cleaner pipes, longer-lasting appliances, and improved water flow throughout your property."
        ],
        features: [
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "70% Limescale Reduction: Significantly reduces calcium and magnesium buildup." },
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "Maintenance-Free: No salt, no chemicals, no recurring costs for consumables." },
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "Eco-Friendly: Zero water wastage and no harmful chemical discharge." },
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "Electrolysis Technology: Utilizes a natural process to condition water." },
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "Easy Cleaning: Can be cleaned with just water every 1-3 months." },
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "Extended Appliance Lifespan: Protects water heaters, geysers, washing machines, etc." },
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "Improved Water Flow: Prevents pipe blockages caused by scale." },
            { icon: <IconCheckCircle className="h-6 w-6 text-brand-blue" />, text: "Versatile Application: Ideal for homes, offices, hotels, and industrial facilities." },
        ],
        benefits: [
            "**Save Money:** Reduce electricity bills by improving efficiency of water heating appliances and extend their lifespan.",
            "**Save Time:** Eliminate the need for frequent descaling and appliance repairs.",
            "**Healthier Water:** Enjoy water that's free from chemical additives typically used in traditional softeners.",
            "**Environmental Impact:** Contribute to a greener planet with a system that wastes no water and uses no harsh chemicals.",
            "**Peace of Mind:** A reliable, low-maintenance solution that keeps your water systems running smoothly."
        ],
        applications: [
            "Residential Homes & Apartments",
            "Hotels & Resorts",
            "Hospitals & Clinics",
            "Commercial Buildings & Offices",
            "Industrial Facilities",
            "Restaurants & Cafes"
        ],
        technicalSpecs: [
            { spec: "Technology", value: "Electrolysis-based Scale Prevention" },
            { spec: "Maintenance", value: "Water rinsing every 1-3 months" },
            { spec: "Chemical Usage", value: "None" },
            { spec: "Water Wastage", value: "Zero" },
            { spec: "Installation", value: "Pre-overhead tank installation recommended" },
            { spec: "Lifespan", value: "Long-lasting (typically 10+ years with proper care)" },
        ],
        faq: [
            { question: "How often do I need to clean the HM Hard Water Scalenor?", answer: "The unit should be cleaned with water every 1-3 months, depending on your water hardness and usage. No chemicals or salt are required." },
            { question: "Is this a water softener?", answer: "No, it's a water conditioner. While a softener removes hard minerals, our Scalenor conditions the water using electrolysis to prevent minerals from forming scale, thus protecting your plumbing and appliances without removing essential minerals." },
            { question: "Will it change the taste of my water?", answer: "No, the HM Hard Water Scalenor does not alter the taste or chemical composition of your water. It only prevents scale formation." },
            { question: "Is it suitable for drinking water?", answer: "The Scalenor is designed to prevent scale in your plumbing and appliances. For drinking water purification, we recommend our RO Water Purifiers." }
        ],
        galleryImages: [
            { src: "https://placehold.co/600x400/FFC107/002D5B?text=Scalenor+Installation+1", alt: "Scalenor Installation 1" },
            { src: "https://placehold.co/600x400/00529B/FFFFFF?text=Scalenor+Product+Shot", alt: "Scalenor Product Shot" },
            { src: "https://placehold.co/600x400/002D5B/FFC107?text=Scalenor+in+Home", alt: "Scalenor in Home" },
            { src: "https://placehold.co/600x400/FFC107/00529B?text=Scalenor+Benefits", alt: "Scalenor Benefits" },
        ]
    };

    // Data for Loyal Customers Section (re-included for self-containment)
    const galleryLogosData = [
        { id: 'c1', name: "S.V. College of Engineering", logo: "https://i.postimg.cc/LhHjn12K/1704565987677-e-2147483647-v-beta-t-xl-Za-Kc-Ec-URa-JGjugiqh-NKL7ov-QC7ai-Rb-m-Fnm3-JAl0k.webp" },
        { id: 'c2', name: "Minerva Grand Hotels", logo: "https://i.postimg.cc/xJPH60G4/512x512bb.webp" },
        { id: 'c3', name: "Annapoorna Hotel", logo: "https://i.postimg.cc/fSTdF6BT/annapoorna-hotel-mailam-tindivanam-caterers-tnncec95ph-jpg-clr.webp" },
        { id: 'c4', name: "Bhimas Hotels", logo: "https://i.postimg.cc/qgjynvvt/download.webp" },
        { id: 'c5', name: "Hotel Bhimas", logo: "https://i.postimg.cc/3dNpZQkt/hotel-bhimas-logo.webp" },
    ];

    const [openIndex, setOpenIndex] = useState(null); // For FAQ accordion

    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[60vh] bg-brand-dark-blue flex items-center justify-center text-white parallax-bg" style={{ backgroundImage: `url(https://placehold.co/1920x800/002D5B/FFC107?text=Water+Scalenors+Hero)` }}>
                <div className="absolute inset-0 bg-black/60"></div>
                <div className={`relative z-10 text-center transition-all duration-700`}>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-shadow-lg mb-4">{singleProductData.name}</h1>
                    <p className="text-lg md:text-xl text-blue-100 text-shadow-md max-w-3xl mx-auto">{singleProductData.tagline}</p>
                </div>
            </section>

            {/* Product Overview */}
            <section className="py-16 bg-white decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Product Overview" subtitle="Understand how our HM Hard Water Scalenors revolutionize water treatment." isInView={true} />
                    <div className={`flex flex-col md:flex-row items-center gap-12 bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 border border-white/50 transition-all duration-700 hover:shadow-xl hover:-translate-y-1`}>
                        <div className="md:w-1/2">
                            <img src={singleProductData.mainImage} alt={singleProductData.name} className="rounded-lg shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/CCCCCC/333333?text=${singleProductData.name.replace(/\s/g, '+')}`; }} />
                        </div>
                        <div className="md:w-1/2 text-gray-700 space-y-4 leading-relaxed text-lg">
                            {singleProductData.overview.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section className="py-16 bg-brand-light-blue decorated-background parallax-bg" style={{ backgroundImage: `url(https://placehold.co/1920x800/00529B/FFC107?text=Features+Background)` }}>
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative z-10 container mx-auto px-6 text-white">
                    <SectionTitle title="Key Features" subtitle="Innovative design for superior performance and lasting protection." isLight={true} isInView={true} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {singleProductData.features.map((feature, index) => (
                            <div key={index} className={`bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 flex items-start text-left border border-white/20 transition-all duration-700 hover:shadow-xl hover:-translate-y-1`} style={{ transitionDelay: `${index * 100}ms` }}>
                                <div className="flex-shrink-0 mr-4 text-brand-yellow">
                                    {feature.icon}
                                </div>
                                <p className="text-white text-md">{feature.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 bg-white decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Unmatched Benefits for You" subtitle="Experience the tangible advantages of truly conditioned water." isInView={true} />
                    <div className={`max-w-4xl mx-auto text-gray-700 space-y-4 leading-relaxed text-lg bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 border border-white/50 transition-all duration-700 hover:shadow-xl hover:-translate-y-1`}>
                        <ul className="list-disc list-inside space-y-2">
                            {singleProductData.benefits.map((benefit, index) => (
                                <li key={index}>{benefit}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* How it Works / Video Section */}
            <section className="py-16 bg-brand-dark-blue parallax-bg" style={{ backgroundImage: `url(https://placehold.co/1920x800/002D5B/FFC107?text=How+It+Works+Background)` }}>
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 container mx-auto px-6 text-white text-center">
                    <SectionTitle title="See It In Action" subtitle="A quick demonstration of how our Scalenor protects your home." isLight={true} isInView={true} />
                    <div className={`w-full max-w-4xl mx-auto rounded-lg shadow-2xl overflow-hidden aspect-video transition-all duration-700 hover:shadow-2xl hover:scale-105`}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={singleProductData.videoUrl}
                            title={`${singleProductData.name} Video`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Applications / Use Cases */}
            <section className="py-16 bg-brand-light-blue decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Ideal for Various Applications" subtitle="Our Scalenors are versatile solutions for diverse environments." isInView={true} />
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 border border-white/50 transition-all duration-700`}>
                        {singleProductData.applications.map((app, index) => (
                            <div key={index} className="flex items-center text-brand-dark-blue font-semibold text-lg hover:text-brand-blue transition-colors">
                                <IconCheckCircle className="h-6 w-6 mr-3 text-brand-blue" /> {app}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technical Specifications */}
            <section className="py-16 bg-white decorated-background parallax-bg" style={{ backgroundImage: `url(https://placehold.co/1920x800/00529B/FFC107?text=Specs+Background)` }}>
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative z-10 container mx-auto px-6 text-white">
                    <SectionTitle title="Technical Specifications" subtitle="Detailed insights into the engineering behind our Scalenors." isLight={true} isInView={true} />
                    <div className={`w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 transition-all duration-700`}>
                        <table className="w-full text-left table-auto">
                            <tbody>
                                {singleProductData.technicalSpecs.map((spec, index) => (
                                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'} hover:bg-white/20 transition-colors`}>
                                        <td className="p-3 font-semibold">{spec.spec}</td>
                                        <td className="p-3">{spec.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Difference between SCALENORS & SOFTENERS SECTION */}
            <ScalenorVsSoftenerSection />

            {/* Product Specific FAQ */}
            <section className="py-16 bg-brand-light-blue decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Common Questions About Scalenors" subtitle="Find quick answers to your queries about our water scalenors." isInView={true} />
                    <div className={`w-full max-w-4xl mx-auto bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-4 transition-all duration-700`}>
                        {singleProductData.faq.map((faq, index) => (
                            <div className="border-b border-brand-blue/20 last:border-b-0" key={index}>
                                <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex justify-between items-center text-left py-4 px-6 hover:bg-gray-100 transition-colors rounded-md">
                                    <span className="font-semibold text-lg text-brand-dark-blue">{faq.question}</span>
                                    <IconChevronDown className={`w-6 h-6 text-brand-blue transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                                    <div className="p-6 pt-0 text-gray-600">{faq.answer}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Image Gallery */}
            <ProductImageGallery images={singleProductData.galleryImages} />

            {/* Testimonial Videos Section */}
            <TestimonialVideosSection />

            {/* Loyal Customers Section */}
            <LoyalCustomersSection clientsData={galleryLogosData} />

            {/* Call to Action */}
            <section className="py-16 bg-brand-dark-blue parallax-bg" style={{ backgroundImage: `url(https://placehold.co/1920x600/002D5B/FFC107?text=CTA+Background)` }}>
                <div className="absolute inset-0 bg-black/70"></div>
                <div className={`relative z-10 container mx-auto px-6 text-center text-white transition-all duration-700`}>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-shadow-lg">Ready to Experience Pure, Scale-Free Water?</h2>
                    <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto text-shadow-md">Contact us today for a free consultation and personalized quote for your HM Hard Water Scalenor.</p>
                    <button onClick={openContactModal} className="bg-brand-yellow text-brand-dark-blue font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-500 transition duration-300 transform hover:scale-105 shadow-lg">
                        Get a Free Quote
                    </button>
                </div>
            </section>

            {/* Google Reviews Section */}
            <GoogleReviewsSection />
        </>
    );
};

export default ProductScalenorPage;
