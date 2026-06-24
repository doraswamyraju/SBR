import React, { useState, useEffect, useRef } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
const IconAward = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;
const IconTarget = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0 7c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-17C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>;
const IconLightbulb = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.69 2 6 4.69 6 8c0 2.5 1.25 4.72 3.25 6.13.33.22.7.37 1.09.47.4.1.81.15 1.16.15.35 0 .76-.05 1.16-.15.39-.1.76-.25 1.09-.47C16.75 12.72 18 10.5 18 8c0-3.31-2.69-6-6-6zm0 14c-2.76 0-5-2.24-5-5V8c0-2.76 2.24-5 5-5s5 2.24 5 5v3c0 2.76-2.24 5-5 5z"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconBolt = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const IconCheckCircle = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.532-1.676-1.676a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
const IconWaterDrop = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a3 3 0 100-6 3 3 0 000 6z" /></svg>;
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


// --- ABOUT PAGE COMPONENT ---
const AboutPage = () => {
    // --- About Page Specific Data ---
    const proprietorData = {
        name: "CHILLAKURU KODANDA RAMI REDDY",
        title: "Founder & Proprietor, Sri Balaji Renewables",
        image: "https://i.postimg.cc/FKk0y9bC/image-e8c0d1.png", // Updated to direct image URL
        bio: [
            "With over two decades of dedicated experience in sustainable energy and water solutions, Mr. Chillakuru Kodanda Rami Reddy is the visionary solo proprietor behind Sri Balaji Renewables, established in 2001.",
            "His journey began with a profound commitment to environmental stewardship and a passion for bringing innovative, eco-friendly technologies to homes and businesses across Tirupati and beyond. Under his astute leadership, Sri Balaji Renewables has grown to become a trusted name, synonymous with quality, reliability, and customer-centric service.",
            "Mr. Reddy's expertise spans a diverse portfolio of renewable energy and water purification systems. He has meticulously cultivated strong partnerships with industry leaders to ensure that Sri Balaji Renewables offers only the best-in-class products and solutions.",
            "He is personally involved in understanding client needs, ensuring that every solution provided is not just technologically advanced but also perfectly tailored to deliver maximum efficiency and long-term savings. His unwavering dedication to 'Maintenance-Free' solutions reflects a deep understanding of customer convenience and product longevity.",
            "Driven by a philosophy of continuous improvement and a forward-looking approach, Mr. Reddy is committed to empowering communities with sustainable choices, contributing significantly to a greener and healthier future."
        ],
        expertise: [
            "Dealers of TATA BP SOLAR and SPC solar water (supplier to TATA)",
            "Specialists in maintenance-free HM hard water scalenors",
            "Providers of ZERO-B automatic water softeners and Pentair (multi-national) water softeners",
            "Suppliers of Racold heat pumps",
            "Experts in Domestic & Commercial RO water plants"
        ]
    };
    const whyUsData = [
        { title: "Two Decades of Expertise", description: "With over 20 years in the industry, we bring unparalleled knowledge and experience to every project.", icon: <IconAward className="h-8 w-8 text-brand-blue" /> },
        { title: "Comprehensive Solutions", description: "From solar energy to advanced water purification, we offer a wide range of products to meet diverse needs.", icon: <IconBolt className="h-8 w-8 text-brand-blue" /> },
        { title: "Maintenance-Free Focus", description: "Our commitment to maintenance-free solutions ensures convenience and long-term savings for our clients.", icon: <IconCheckCircle className="h-8 w-8 text-brand-blue" /> },
        { title: "Trusted Partnerships", description: "We collaborate with industry leaders like TATA BP Solar, ZERO-B, and Pentair to deliver top-tier products.", icon: <IconUsers className="h-8 w-8 text-brand-blue" /> },
        { title: "Customer-Centric Approach", description: "Your satisfaction is our priority. We provide personalized solutions and dedicated support.", icon: <IconUser className="h-8 w-8 text-brand-blue" /> },
        { title: "Sustainable Impact", description: "We are passionate about contributing to a greener planet by promoting eco-friendly technologies.", icon: <IconWaterDrop className="h-8 w-8 text-brand-blue" /> },
    ];
    const visionData = {
        title: "Our Vision",
        subtitle: "To be the leading catalyst for sustainable living, empowering every home and business with accessible, efficient, and eco-friendly energy and water solutions.",
        image: "https://i.postimg.cc/CLY1zN0N/image-0-Kw9-NYGS.png" // Updated to direct image URL
    };
    const missionData = {
        title: "Our Mission",
        subtitle: "To meticulously design, supply, and install innovative solar and water purification systems, ensuring superior quality, unparalleled customer satisfaction, and a lasting positive impact on the environment.",
        image: "https://i.postimg.cc/zX41y01c/image-6-Tk9m-Pwf.png" // Updated to direct image URL
    };

    return (
        <>
            {/* Hero Section for About Page */}
            <section className="relative h-[50vh] bg-brand-dark-blue flex items-center justify-center text-white">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-shadow-lg mb-4">About Us</h1>
                    <p className="text-lg md:text-xl text-blue-100 text-shadow-md">Your trusted partner for sustainable solutions since 2001.</p>
                </div>
            </section>

            {/* Meet the Proprietor Section */}
            <section id="proprietor" className="py-16 bg-brand-light-blue decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Meet Our Visionary Founder" subtitle="Leading Sri Balaji Renewables with dedication and expertise." isInView={true} />
                    <div className="flex flex-col md:flex-row items-center bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 gap-8 border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="md:w-1/3 flex-shrink-0">
                            <img src={proprietorData.image} alt="CHILLAKURU KODANDA RAMI REDDY" className="rounded-lg shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105" />
                            <h3 className="text-center text-2xl font-bold text-brand-dark-blue mt-4">{proprietorData.name}</h3>
                            <p className="text-center text-brand-blue text-md">{proprietorData.title}</p>
                        </div>
                        <div className="md:w-2/3 text-gray-700 space-y-4 leading-relaxed text-lg">
                            {proprietorData.bio.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                            <h4 className="text-xl font-semibold text-brand-dark-blue mt-6">Our Core Expertise:</h4>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                {proprietorData.expertise.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Us Section */}
            <section className="py-16 bg-white decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Why Choose Sri Balaji Renewables?" subtitle="Experience the difference of dedicated service and superior solutions." isInView={true} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {whyUsData.map((item, index) => (
                            <div key={index} className="bg-white/60 backdrop-blur-lg rounded-xl shadow-lg p-6 text-center border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="mb-4 flex justify-center">{item.icon}</div>
                                <h3 className="text-xl font-bold text-brand-dark-blue mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section className="py-16 bg-brand-light-blue decorated-background">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 gap-8 border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="md:w-1/2">
                            <img src={visionData.image} alt="Our Vision" className="rounded-lg shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105" />
                        </div>
                        <div className="md:w-1/2 text-gray-700 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-brand-dark-blue mb-4">{visionData.title}</h2>
                            <p className="text-lg leading-relaxed">{visionData.subtitle}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 bg-white decorated-background">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row-reverse items-center bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 gap-8 border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="md:w-1/2">
                            <img src={missionData.image} alt="Our Mission" className="rounded-lg shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105" />
                        </div>
                        <div className="md:w-1/2 text-gray-700 text-center md:text-right">
                            <h2 className="text-3xl font-bold text-brand-dark-blue mb-4">{missionData.title}</h2>
                            <p className="text-lg leading-relaxed">{missionData.subtitle}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Journey/History Section */}
            <section className="py-16 bg-white decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Our Journey: A Legacy of Sustainability" subtitle="Building a greener future, one solution at a time." isInView={true} />
                    <div className="max-w-4xl mx-auto text-gray-700 space-y-6 leading-relaxed text-lg bg-white/60 backdrop-blur-xl rounded-xl shadow-2xl p-8 border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <p>Established in 2001, Sri Balaji Renewables embarked on a mission to revolutionize energy consumption and water management in Tirupati. From our humble beginnings, we have grown steadily, driven by a commitment to quality, innovation, and customer satisfaction.</p>
                        <p>Over the years, we have adapted to evolving technologies and market needs, consistently expanding our product portfolio to include cutting-edge solar and water solutions. Our journey is marked by countless successful installations, satisfied clients, and a growing reputation as a leader in sustainable practices.</p>
                        <p>We take immense pride in our contribution to environmental conservation and in helping our clients achieve significant savings while reducing their carbon footprint. Our history is a testament to our enduring vision and the trust placed in us by the community.</p>
                    </div>
                </div>
            </section>

            <GoogleReviewsSection />
        </>
    );
};

export default AboutPage;
