import React, { useState, useEffect, useRef } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
const IconCheckCircle = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.532-1.676-1.676a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
const IconChevronDown = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const IconStar = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" /></svg>;

// --- PRODUCTS DATA ---
const productsData = {
    'hmws': {
        name: "HM Hard Water Scalenors",
        image: "https://i.postimg.cc/sQDwJZY8/scalenor.png",
        subtitle: "Maintenance-Free Electrolysis Salt-Free Water Treatment",
        tagline: "Eco-friendly, chemical-free scale protection for your entire home.",
        description: "The Maintenance-Free HM Hard Water Scalenor utilizes advanced electrolysis salt-free technology to solve your scaling problems. By collecting approximately 70% of calcium and magnesium (scale-forming minerals) before the water enters your overhead tank, it ensures that your plumbing, showers, and home appliances remain free from aggressive scale buildup without wasting water or using salt.",
        features: [
            "Zero Water Wastage: Eco-friendly system that operates with absolutely no water rejection.",
            "Chemical-Free & Salt-Free: Does not add sodium or harmful chemicals, maintaining natural drinking-water safety.",
            "Active Electrolysis Treatment: Physically binds scale-causing elements on internal elements.",
            "Minimal, Tool-Free Maintenance: Simply wash the interior core with normal water once every 1 to 3 months.",
            "Plumbing & Appliance Shield: Extends the life of geysers, solar water heaters, and washing machines."
        ],
        specifications: {
            "Technology": "Electrolysis-Based Descaling",
            "Performance": "Collects ~70% of dissolved Calcium & Magnesium",
            "Operating Maintenance": "Rinse with normal water every 30 to 90 days",
            "Installation Type": "Inlet pipe connection before the Overhead Tank",
            "Lifespan": "Long durability with non-degrading metal electrodes"
        },
        faqs: [
            { q: "Is the SBR Scalenor a standard water softener?", a: "No. Traditional softeners use salt (sodium) to swap calcium ions, which wastes water during regeneration. The SBR Scalenor uses electrolysis to physically attract and capture the hardness scale, using no salt and wasting no water." },
            { q: "Does the output water taste different?", a: "No. Since it doesn't add sodium or extract all natural minerals, the natural taste of the water remains completely intact and safe for consumption." }
        ]
    },
    'aws': {
        name: "ZERO-B & 3M Automatic Water Softeners",
        image: "https://i.postimg.cc/BPjpr9wB/softener.png",
        subtitle: "Premium Automated Ion-Exchange Softening Systems",
        tagline: "Unparalleled soft water luxury for healthy skin, glowing hair, and pristine bath fittings.",
        description: "We supply and install top-tier automatic water softeners from Zero-B, 3M, and Pentair. Designed with automatic metered regeneration valves, these systems utilize premium ion-exchange resins to effectively extract hard water minerals. Perfect for villas, residential houses, and commercial centers seeking flawless soft water.",
        features: [
            "Automated Regeneration: Smart valves trigger washing cycles based on your water usage.",
            "Premium Grade Resins: Highly efficient food-grade polymer exchange media.",
            "Skincare & Haircare Booster: Reduces hair fall and dry skin caused by hard water deposits.",
            "Appliance Protection: Completely eliminates scale buildup in washing machines, geysers, and dishwashers.",
            "Soap & Detergent Savings: Requires 50% less soap and shampoo to create a rich lather."
        ],
        specifications: {
            "Technology": "Ion-Exchange Resin Softening",
            "Brands Offered": "Zero-B, 3M, Pentair",
            "Treatment Capacity": "1,000 LPH to 10,000 LPH based on system sizing",
            "Regeneration Cycle": "Automatic Metered / Time-controlled",
            "Vessel Material": "FRP (Fiberglass Reinforced Plastic) heavy-duty casing"
        },
        faqs: [
            { q: "How often do I need to refill the salt?", a: "Typically once or twice a month, depending on your water consumption and initial water hardness. You simply add standard industrial salt tablets to the brine tank." },
            { q: "Do these softeners require electricity?", a: "Yes, the automatic control valve requires a standard 220V AC plug to power the digital display and control cycle motor." }
        ]
    },
    'swh': {
        name: "SPC Solar Water Heaters (TATA BP Solar Partner)",
        image: "https://i.postimg.cc/CZp2b16T/solar-water-heater.png",
        subtitle: "Evacuated Tube (ETC) & Ultima Pressurized Solar Heating Systems",
        tagline: "Harness clean solar energy with an industry-leading 5-year replacement guarantee.",
        description: "Sri Balaji Renewables is a trusted pioneer in solar heating, acting as a TATA BP Solar partner since 2001 with over 3,000 satisfied installations. Our SPC Solar Water Heaters are built using high-efficiency three-target evacuated tubes. We offer a 5-year comprehensive replacement guarantee on both ETC models and Ultima pressurized models.",
        features: [
            "TATA BP Solar Heritage: Developed in alignment with top solar engineering standards.",
            "5-Year Replacement Warranty: Complete peace of mind with replacement coverage.",
            "Superior Glass Tubes: High-grade three-target ETC technology captures maximum heat.",
            "Insulated Storage Tank: Polyurethane Foam (PUF) insulation retains water temperature overnight.",
            "Rust-Resistant Tank: Inner storage tank crafted from food-grade Stainless Steel (SS 304)."
        ],
        specifications: {
            "System Capacities": "100 LPD, 200 LPD, 300 LPD, 500 LPD, 1000 LPD",
            "Tube Type": "Borosilicate glass Evacuated Tube Collectors (ETC)",
            "Inner Tank Material": "SS 304 Grade / Porcelain Enamel Coated",
            "Warranty Details": "5 Years comprehensive replacement warranty",
            "Optional Add-ons": "Built-in electric heater backup and sacrificial anode rod"
        },
        faqs: [
            { q: "Will I get hot water on cloudy days?", a: "Our evacuated tubes absorb infrared radiation, meaning they can heat water even under light cloud cover. For prolonged rainy seasons, we can install a built-in backup thermostat heater." },
            { q: "How long does a typical installation take?", a: "Usually, a standard rooftop installation is completed within 3 to 6 hours on a prepared level surface." }
        ]
    },
    'rowp': {
        name: "Commercial & Industrial RO Water Plants",
        image: "https://i.postimg.cc/G4ZpYZDT/ro-plant.png",
        subtitle: "High-Capacity Reverse Osmosis Systems",
        tagline: "Industrial-grade water purification for commercial establishments, apartments, and schools.",
        description: "Our commercial and industrial Reverse Osmosis (RO) plants provide highly optimized filtration. Utilizing multi-stage pre-filters (sand filter, activated carbon, and micron cartridges) and heavy-duty RO membranes, they remove up to 98% of total dissolved solids (TDS), heavy metals, viruses, and chemicals.",
        features: [
            "Multi-Stage Pre-Filtration: Removes suspended particles, chlorine, organic matter, and odor.",
            "98% TDS Reduction: Transforms high-salinity groundwater into clean, soft drinking water.",
            "Heavy-Duty Stainless Steel Skid: Sturdy SS 304 framework for maximum vibration dampening.",
            "Automatic Flush Valve: System auto-cleans membranes during startup to prevent scaling.",
            "Comprehensive Monitoring: Flow meters, pressure indicators, and TDS controllers included."
        ],
        specifications: {
            "Plant Output": "250 LPH, 500 LPH, 1000 LPH, 2000 LPH up to 10,000 LPH",
            "Membrane Grade": "High-rejection Dow Filmtec / Hydranautics membranes",
            "Skid Construction": "Premium Grade SS 304 skid",
            "Operation Type": "Semi-Automatic / Fully Automatic PLC Panels",
            "Raw Water TDS": "Up to 3,000 ppm input tolerance"
        },
        faqs: [
            { q: "What maintenance does a commercial RO plant require?", a: "Requires regular sand and carbon filter backwashing (typically weekly) and changing the sediment cartridges every 1 to 2 months. Membranes last 2 to 3 years depending on usage." },
            { q: "Can we integrate this with an existing storage tank?", a: "Yes, we can seamlessly connect the RO plant output directly to your building's overhead drinking water tank." }
        ]
    },
    'drop': {
        name: "Domestic RO Purifiers",
        image: "https://placehold.co/400x300/00529B/FFFFFF?text=Domestic+RO",
        subtitle: "Home RO + UV + UF + Alkaline Water Purifiers",
        tagline: "Advanced multi-stage residential purification for safe, mineral-rich drinking water.",
        description: "Ensure the health of your family with SBR's domestic RO purifiers. Combining Reverse Osmosis, UV sterilization, Ultra Filtration, and Alkaline mineral enrichers, these compact wall-mountable systems remove impurities while keeping essential minerals and maintaining a healthy pH level.",
        features: [
            "7-Stage Purification: Full filtration layout ensuring absolute purity.",
            "Active Copper & Alkaline Filter: Restores essential minerals like copper and calcium.",
            "UV Tank Sterilization: LED UV light in the storage tank prevents secondary bacteria growth.",
            "Sleek Food-Grade ABS Casing: Wall-mountable or table-top setup with clear level indicators.",
            "Input Water versatility: Purifies water from municipal taps, borewells, or water tankers."
        ],
        specifications: {
            "Filtration Speed": "12 to 15 Liters per hour",
            "Storage Volume": "8 to 12 Liters active storage tank",
            "Purification Technology": "RO + UV + UF + Active Copper + Alkaline",
            "Sensors": "Auto-shutoff full tank sensor and dry run protection",
            "TDS Range": "Handles input water up to 2,000 ppm"
        },
        faqs: [
            { q: "Why is the alkaline filter important?", a: "Standard RO systems can make water slightly acidic by removing minerals. Our alkaline filter restores trace minerals (Calcium, Magnesium, Copper) and raises the pH to a healthy alkaline range (7.5 - 8.5)." },
            { q: "How often should filters be changed?", a: "Sediment and carbon pre-filters should be replaced once a year, and the main RO membrane every 1.5 to 2 years." }
        ]
    },
    'sps': {
        name: "TATA Solar Power Systems",
        image: "https://placehold.co/400x300/002D5B/FFC107?text=Solar+Power+System",
        subtitle: "On-Grid, Off-Grid & Hybrid Rooftop Solar Systems",
        tagline: "Generate your own clean electricity and reduce your power bills to zero.",
        description: "Partnering with TATA Solar, we design and install high-quality rooftop solar installations for residential villas, schools, institutions, and industrial setups. Save up to 90% on electricity bills with government-approved net metering setups.",
        features: [
            "TATA Solar Quality: High-performance solar cells with exceptional degradation warranties.",
            "Net Metering Support: Complete assistance with grid synchronization, approvals, and subsidies.",
            "Instant Cost Reduction: drastially lower your residential or commercial monthly power bills.",
            "25-Year Performance Guarantee: Long-term panels built to deliver power for decades.",
            "Mobile Monitoring: Check solar generation statistics on your phone anytime."
        ],
        specifications: {
            "System Capacities": "1 kW, 3 kW, 5 kW, 10 kW up to 100 kW",
            "Panel Technology": "Mono-PERC Half-cut Cell high-efficiency panels",
            "Solar Inverter": "High-efficiency Grid-tied / Hybrid solar inverters",
            "Mounting Structure": "Anodized Aluminium / Galvanized Iron structure",
            "Grid Integration": "Net-metering standard compliant"
        },
        faqs: [
            { q: "What is the difference between On-grid and Off-grid systems?", a: "On-grid systems send excess solar power to the government grid (using net metering to reduce bills), but shut down during blackouts for safety. Off-grid/Hybrid systems connect to batteries to store backup power for grid outages." },
            { q: "How much shadow-free space is required?", a: "Typically, you need about 90 to 100 square feet of flat, shadow-free roof space per 1 kW of solar capacity." }
        ]
    },
    'fse': {
        name: "Fenice Solar Energy Solutions",
        image: "https://placehold.co/400x300/002D5B/FFC107?text=Fenice+Solar",
        subtitle: "High-Efficiency Photovoltaic Modular Systems",
        tagline: "Next-generation solar technology for heavy commercial and industrial properties.",
        description: "The Fenice Solar Energy System is a cutting-edge photovoltaic solution designed for maximum power extraction. Utilizing high-efficiency cells that capture diffused light even under low-radiation cloudy conditions, it is the perfect fit for industrial plants and modern green architectural designs.",
        features: [
            "Low-Light Efficiency: Produces electricity during overcast and rainy seasons.",
            "Modular Solar String Layout: Allows quick scalability and clean wiring structures.",
            "Thermal Management: Custom bypass diodes minimize output loss from partial shadow.",
            "Tough Load Certifications: High wind and snow resistance for rooftop durability.",
            "Precision String Monitoring: Instant performance notifications for predictive maintenance."
        ],
        specifications: {
            "Panel Wattage": "450W to 550W modules",
            "Cell Type": "N-Type Monocrystalline Photovoltaic Cells",
            "Module Efficiency": "Up to 21.8% efficiency rating",
            "Junction Box Rating": "IP68 dust and water proof",
            "Operating Temperature": "-40°C to +85°C"
        },
        faqs: [
            { q: "What makes Fenice N-type cells superior?", a: "N-type monocrystalline cells have a lower degradation rate over time and are less affected by heat, yielding more kilowatt-hours of power per year than standard P-type panels." },
            { q: "Can SBR help with solar loans?", a: "Yes, we partner with major local banks to offer solar finance options with simple documentation." }
        ]
    },
    'hp': {
        name: "Racold & Sun-Max Heat Pumps",
        image: "https://i.postimg.cc/XZzp2ptq/heat-pump.png",
        subtitle: "Centralized Thermodynamic Water Heating Systems",
        tagline: "Save up to 70% in power bills compared to standard electric water heaters.",
        description: "Get energy-efficient water heating with centralized heat pumps from Racold and Sun-Max. Using a thermodynamic refrigeration cycle, heat pumps extract heat from the surrounding air and transfer it directly to your water supply, providing 24/7 hot water at a fraction of the cost of standard electric heaters.",
        features: [
            "70% Electricity Savings: Thermodynamic cycle heats water with minimal power consumption.",
            "Centralized hot water: Single rooftop heat pump supplies hot water to all bathrooms.",
            "All-Weather Operation: Functions day and night, in rains or winters, unlike solar heaters.",
            "Eco-Friendly: Low carbon footprint using environmentally friendly refrigerant.",
            "Digital Control Panel: Program temperature and cycles dynamically."
        ],
        specifications: {
            "Brands Offered": "Racold, Sun-Max",
            "Tank Capacities": "150 L, 200 L, 300 L, 500 L up to 2000 L",
            "COP Index": "Up to 4.2 (Highly efficient heat transfer)",
            "Tank Coating": "Titanium Vitreous Enamel lining prevents corrosion",
            "Refrigerant Gas": "Eco-friendly R134a / R410A"
        },
        faqs: [
            { q: "How does a heat pump work?", a: "It works like a reverse refrigerator. It absorbs ambient heat from the air, runs it through a compressor to raise the temperature, and transfers that heat to the water, giving you 3 to 4 times more thermal energy than the electricity used." },
            { q: "Can it be installed in an apartment building?", a: "Yes. Centralized heat pumps are the preferred choice for multi-story apartments, luxury villas, hotels, and hospitals." }
        ]
    }
};

const SectionTitle = ({ title, subtitle, isLight = false }) => (
    <div className="text-center mb-12">
        <h2 className={`text-3xl md:text-4xl font-bold ${isLight ? 'text-white' : 'text-brand-dark-blue'}`}>{title}</h2>
        {subtitle && <p className={`mt-2 max-w-2xl mx-auto ${isLight ? 'text-blue-200' : 'text-gray-600'}`}>{subtitle}</p>}
        <div className="mt-4 w-24 h-1 bg-brand-yellow mx-auto"></div>
    </div>
);

// --- Google Reviews Section ---
const GoogleReviewsSection = () => {
    const reviews = [
        { id: 1, author: "Suresh Kumar", rating: 5, comment: "Excellent service and high-quality solar water heater. Highly recommended for sustainable solutions!", date: "July 1, 2024" },
        { id: 2, author: "Priya Sharma", rating: 5, comment: "The water softener works wonders! No more hard water issues. Professional installation and great support.", date: "June 25, 2024" },
        { id: 3, author: "Rajesh V.", rating: 4, comment: "Good experience with the RO plant installation. Pure water and efficient service. A bit slow on initial response, but overall satisfied.", date: "June 18, 2024" },
        { id: 4, author: "Anitha Reddy", rating: 5, comment: "Very happy with the heat pump. Significant savings on electricity bills. Sri Balaji Renewables delivered on their promise.", date: "June 10, 2024" },
    ];

    return (
        <section className="py-16 bg-brand-light-blue decorated-background">
            <div className="container mx-auto px-6">
                <SectionTitle title="What Our Clients Say" subtitle="Hear from our satisfied customers about their experience with Sri Balaji Renewables." />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white/60 backdrop-blur-lg rounded-xl shadow-lg p-6 text-center border border-white/50 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-center mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <IconStar key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <p className="text-gray-700 text-md italic mb-4">"{review.comment}"</p>
                            <p className="font-semibold text-brand-dark-blue">{review.author}</p>
                            <p className="text-gray-500 text-sm">{review.date}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- ProductDetail Page Component ---
const ProductDetail = ({ productId, handleNavigation, openContactModal }) => {
    const product = productsData[productId] || productsData['hmws'];
    const [activeFaq, setActiveFaq] = useState(null);

    // Dynamic state for Quick Booking Form
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    // Keep state values in sync if productId changes
    useEffect(() => {
        setSubmitStatus(null);
        setActiveFaq(null);
        setFormData({ name: '', phone: '', address: '', notes: '' });
    }, [productId]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await fetch('/api/service-requests/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    serviceType: product.name,
                    description: formData.notes || `Requesting details/quote for ${product.name}`
                })
            });

            if (response.ok) {
                setSubmitStatus('success');
                setFormData({ name: '', phone: '', address: '', notes: '' });
            } else {
                setSubmitStatus('error');
            }
        } catch (err) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-brand-light-blue min-h-screen">
            {/* Hero Section */}
            <section className="relative py-24 bg-brand-dark-blue text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-dark-blue to-brand-blue/80 opacity-95"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-3xl">
                        <span className="bg-brand-yellow text-brand-dark-blue font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-4 inline-block">
                            SBR Products
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
                            {product.name}
                        </h1>
                        <p className="text-xl text-blue-100 font-semibold mb-6">
                            {product.subtitle}
                        </p>
                        <p className="text-lg text-gray-300 leading-relaxed italic">
                            "{product.tagline}"
                        </p>
                    </div>
                </div>
            </section>

            {/* Product Overview Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Left Content (Details & Features) */}
                        <div className="lg:col-span-7">
                            <h2 className="text-3xl font-bold text-brand-dark-blue mb-6">Product Overview</h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                {product.description}
                            </p>

                            <h3 className="text-2xl font-bold text-brand-dark-blue mb-4">Key Features</h3>
                            <ul className="space-y-4">
                                {product.features.map((feature, index) => (
                                    <li key={index} className="flex items-start bg-brand-light-blue/40 p-4 rounded-lg border border-brand-light-blue">
                                        <IconCheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700 text-md leading-relaxed">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right Content (Image, Specs Table, Booking Panel) */}
                        <div className="lg:col-span-5 space-y-8">
                            {/* Product Card */}
                            <div className="bg-brand-light-blue rounded-xl p-6 border border-gray-200/60 shadow-md">
                                <div className="bg-white rounded-lg p-6 flex justify-center mb-6">
                                    <img 
                                        src={product.image} 
                                        alt={product.name} 
                                        className="h-64 object-contain"
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = `https://placehold.co/400x300/CCCCCC/333333?text=${product.name.replace(/\s/g, '+')}`; 
                                        }} 
                                    />
                                </div>

                                <h3 className="text-xl font-bold text-brand-dark-blue mb-4">Technical Specifications</h3>
                                <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <tbody className="divide-y divide-gray-200">
                                            {Object.entries(product.specifications).map(([key, val]) => (
                                                <tr key={key}>
                                                    <td className="px-4 py-3 font-semibold text-brand-dark-blue bg-brand-light-blue/40 w-1/3">{key}</td>
                                                    <td className="px-4 py-3 text-gray-600">{val}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Service Request / Contact Panel */}
                            <div className="bg-brand-dark-blue text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 h-32 w-32 bg-brand-blue/30 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                <h3 className="text-2xl font-bold text-brand-yellow mb-2">Request a Quote / Service</h3>
                                <p className="text-blue-100 text-sm mb-6">Get connected with our sales engineers to get a custom solution for your property.</p>

                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-blue-200 font-bold mb-1">Your Name</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter Full Name" 
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-blue-200 font-bold mb-1">Phone Number</label>
                                        <input 
                                            type="tel" 
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="Enter Contact Number" 
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-blue-200 font-bold mb-1">Property Address</label>
                                        <input 
                                            type="text" 
                                            name="address"
                                            required
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="City or Area (Tirupati, etc.)" 
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-blue-200 font-bold mb-1">Additional Requirements</label>
                                        <textarea 
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            placeholder="Capacity needed, scale issues, etc." 
                                            rows="2"
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm resize-none"
                                        ></textarea>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full bg-brand-yellow text-brand-dark-blue font-bold py-2.5 rounded-lg hover:bg-yellow-500 transition duration-300 shadow-md text-sm uppercase tracking-wider"
                                    >
                                        {isSubmitting ? 'Sending Request...' : 'Submit Request'}
                                    </button>

                                    {submitStatus === 'success' && (
                                        <div className="bg-green-500/25 border border-green-500 text-green-300 rounded-lg p-3 text-center text-xs font-semibold mt-2">
                                            Request received! SBR team will contact you shortly.
                                        </div>
                                    )}

                                    {submitStatus === 'error' && (
                                        <div className="bg-red-500/25 border border-red-500 text-red-300 rounded-lg p-3 text-center text-xs font-semibold mt-2">
                                            Booking failed. Please call +91-9848182595 directly.
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product FAQs Section */}
            <section className="py-16 bg-brand-light-blue border-t border-b border-gray-200/40">
                <div className="container mx-auto px-6 max-w-4xl">
                    <SectionTitle title="Frequently Asked Questions" subtitle={`Learn more about SBR's ${product.name}.`} />
                    <div className="space-y-4 mt-8">
                        {product.faqs.map((faq, index) => {
                            const isOpen = activeFaq === index;
                            return (
                                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-150 transition-all duration-300">
                                    <button 
                                        onClick={() => setActiveFaq(isOpen ? null : index)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-brand-dark-blue hover:text-brand-blue focus:outline-none transition-colors"
                                    >
                                        <span className="text-md md:text-lg">{faq.q}</span>
                                        <IconChevronDown className={`h-5 w-5 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-yellow' : 'text-gray-400'}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-80 border-t border-gray-100' : 'max-h-0'}`}>
                                        <p className="px-6 py-4 text-gray-600 leading-relaxed text-sm md:text-md">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Social Reviews Section */}
            <GoogleReviewsSection />
        </div>
    );
};

export default ProductDetail;
