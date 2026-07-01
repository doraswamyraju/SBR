import React, { useState, useEffect, useRef } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
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


// --- PRODUCTS PAGE COMPONENT ---
const ProductsPage = ({ handleNavigation }) => {
    // --- All Products Page Specific Data ---
    const allProductsPageData = [
        { id: 'swh', name: "Solar Water Heaters", image: "https://i.postimg.cc/CZp2b16T/solar-water-heater.png", searchQuery: "solar water heater description features benefits", description: "Harness the power of the sun for efficient, eco-friendly hot water." },
        { id: 'hmws', name: "HM Hard Water Scalenors", image: "https://i.postimg.cc/sQDwJZY8/scalenor.png", searchQuery: "HM hard water scalenor description benefits", description: "Protect your pipes and appliances with our maintenance-free scalenor." },
        { id: 'aws', name: "Automatic Water Softeners", image: "https://i.postimg.cc/BPjpr9wB/softener.png", searchQuery: "automatic water softener how it works benefits", description: "Experience the luxury of soft water for healthier skin and hair." },
        { id: 'rowp', name: "RO Water Plants", image: "https://i.postimg.cc/G4ZpYZDT/ro-plant.png", searchQuery: "RO water plant commercial domestic features", description: "Ensure pure and safe drinking water for your home or business." },
        { id: 'drop', name: "Domestic RO Purifier", image: "https://placehold.co/400x300/00529B/FFFFFF?text=Domestic+RO", searchQuery: "domestic RO purifier specifications benefits", description: "Get pure and safe drinking water for your home." },
        { id: 'sps', name: "Solar Power Systems", image: "https://placehold.co/400x300/002D5B/FFC107?text=Solar+Power+System", searchQuery: "solar power systems benefits components", description: "Generate your own clean electricity and reduce your bills." },
        { id: 'fse', name: "Fenice Solar Energy", image: "https://placehold.co/400x300/002D5B/FFC107?text=Fenice+Solar", searchQuery: "Fenice Solar Energy products features", description: "Advanced solar energy solutions for various applications." },
        { id: 'hp', name: "Heat Pumps", image: "https://i.postimg.cc/XZzp2ptq/heat-pump.png", searchQuery: "Racold heat pumps features benefits", description: "Energy-efficient water heating with advanced heat pump technology." },
    ];

    return (
        <>
            {/* Hero Section for All Products Page */}
            <section className="relative h-[50vh] bg-brand-dark-blue flex items-center justify-center text-white">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-shadow-lg mb-4">Our Products</h1>
                    <p className="text-lg md:text-xl text-blue-100 text-shadow-md">Explore our comprehensive range of sustainable energy and water solutions.</p>
                </div>
            </section>

            {/* All Products Grid Section */}
            <section id="all-products" className="py-16 bg-brand-light-blue decorated-background">
                <div className="container mx-auto px-6">
                    <SectionTitle title="Discover Our Solutions" subtitle="From solar innovations to advanced water purification, find the perfect product for your needs." isInView={true} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {allProductsPageData.map((product, index) => (
                            <div key={product.id} className="bg-white/60 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden group text-center h-full flex flex-col border border-white/50 hover:shadow-2xl hover:border-brand-yellow transition-all duration-300 transform hover:-translate-y-2">
                                <div className="p-4 bg-white">
                                    <img src={product.image} alt={product.name} className="w-full h-48 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/CCCCCC/333333?text=${product.name.replace(/\s/g, '+')}`; }} />
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="text-xl font-bold text-brand-dark-blue mb-2">{product.name}</h3>
                                    <p className="text-gray-600 text-sm flex-grow mb-4">{product.description || "Details coming soon..."}</p>
                                    <button onClick={() => handleNavigation('product-' + product.id)} className="mt-auto inline-block bg-brand-blue text-white font-semibold py-2 px-6 rounded-full hover:bg-brand-dark-blue transition-all duration-300">
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <GoogleReviewsSection />
        </>
    );
};

export default ProductsPage;
