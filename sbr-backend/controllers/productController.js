const Product = require('../models/Product');

// Initial default seed products based on ProductDetail.jsx
const defaultProducts = [
  {
    slug: 'hmws',
    name: 'HM Hard Water Scalenors',
    category: 'Water Treatment',
    image: 'https://i.postimg.cc/sQDwJZY8/scalenor.png',
    images: ['https://i.postimg.cc/sQDwJZY8/scalenor.png'],
    subtitle: 'Maintenance-Free Electrolysis Salt-Free Water Treatment',
    tagline: 'Eco-friendly, chemical-free scale protection for your entire home.',
    description: 'The Maintenance-Free HM Hard Water Scalenor utilizes advanced electrolysis salt-free technology to solve your scaling problems. By collecting approximately 70% of calcium and magnesium (scale-forming minerals) before the water enters your overhead tank, it ensures that your plumbing, showers, and home appliances remain free from aggressive scale buildup without wasting water or using salt.',
    features: [
      'Zero Water Wastage: Eco-friendly system that operates with absolutely no water rejection.',
      'Chemical-Free & Salt-Free: Does not add sodium or harmful chemicals, maintaining natural drinking-water safety.',
      'Active Electrolysis Treatment: Physically binds scale-causing elements on internal elements.',
      'Minimal, Tool-Free Maintenance: Simply wash the interior core with normal water once every 1 to 3 months.',
      'Plumbing & Appliance Shield: Extends the life of geysers, solar water heaters, and washing machines.'
    ],
    specifications: {
      'Technology': 'Electrolysis-Based Descaling',
      'Performance': 'Collects ~70% of dissolved Calcium & Magnesium',
      'Operating Maintenance': 'Rinse with normal water every 30 to 90 days',
      'Installation Type': 'Inlet pipe connection before the Overhead Tank',
      'Lifespan': 'Long durability with non-degrading metal electrodes'
    },
    faqs: [
      { q: 'Is the SBR Scalenor a standard water softener?', a: 'No. Traditional softeners use salt (sodium) to swap calcium ions, which wastes water during regeneration. The SBR Scalenor uses electrolysis to physically attract and capture the hardness scale, using no salt and wasting no water.' },
      { q: 'Does the output water taste different?', a: 'No. Since it doesn\'t add sodium or extract all natural minerals, the natural taste of the water remains completely intact and safe for consumption.' }
    ],
    basePrice: 18500,
    mrp: 22000,
    commissionType: 'fixed',
    commissionValue: 1000,
    isActive: true
  },
  {
    slug: 'aws',
    name: 'ZERO-B & 3M Automatic Water Softeners',
    category: 'Water Treatment',
    image: 'https://i.postimg.cc/BPjpr9wB/softener.png',
    images: ['https://i.postimg.cc/BPjpr9wB/softener.png'],
    subtitle: 'Premium Automated Ion-Exchange Softening Systems',
    tagline: 'Unparalleled soft water luxury for healthy skin, glowing hair, and pristine bath fittings.',
    description: 'We supply and install top-tier automatic water softeners from Zero-B, 3M, and Pentair. Designed with automatic metered regeneration valves, these systems utilize premium ion-exchange resins to effectively extract hard water minerals. Perfect for villas, residential houses, and commercial centers seeking flawless soft water.',
    features: [
      'Automated Regeneration: Smart valves trigger washing cycles based on your water usage.',
      'Premium Grade Resins: Highly efficient food-grade polymer exchange media.',
      'Skincare & Haircare Booster: Reduces hair fall and dry skin caused by hard water deposits.',
      'Appliance Protection: Completely eliminates scale buildup in washing machines, geysers, and dishwashers.',
      'Soap & Detergent Savings: Requires 50% less soap and shampoo to create a rich lather.'
    ],
    specifications: {
      'Technology': 'Ion-Exchange Resin Softening',
      'Brands Offered': 'Zero-B, 3M, Pentair',
      'Treatment Capacity': '1,000 LPH to 10,000 LPH based on system sizing',
      'Regeneration Cycle': 'Automatic Metered / Time-controlled',
      'Vessel Material': 'FRP (Fiberglass Reinforced Plastic) heavy-duty casing'
    },
    faqs: [
      { q: 'How often do I need to refill the salt?', a: 'Typically once or twice a month, depending on your water consumption and initial water hardness. You simply add standard industrial salt tablets to the brine tank.' },
      { q: 'Do these softeners require electricity?', a: 'Yes, the automatic control valve requires a standard 220V AC plug to power the digital display and control cycle motor.' }
    ],
    basePrice: 38000,
    mrp: 45000,
    commissionType: 'fixed',
    commissionValue: 1500,
    isActive: true
  },
  {
    slug: 'swh',
    name: 'SPC Solar Water Heaters (TATA BP Solar Partner)',
    category: 'Solar Heating',
    image: 'https://i.postimg.cc/CZp2b16T/solar-water-heater.png',
    images: ['https://i.postimg.cc/CZp2b16T/solar-water-heater.png'],
    subtitle: 'Evacuated Tube (ETC) & Ultima Pressurized Solar Heating Systems',
    tagline: 'Harness clean solar energy with an industry-leading 5-year replacement guarantee.',
    description: 'Sri Balaji Renewables is a trusted pioneer in solar heating, acting as a TATA BP Solar partner since 2001 with over 3,000 satisfied installations. Our SPC Solar Water Heaters are built using high-efficiency three-target evacuated tubes. We offer a 5-year comprehensive replacement guarantee on both ETC models and Ultima pressurized models.',
    features: [
      'TATA BP Solar Heritage: Developed in alignment with top solar engineering standards.',
      '5-Year Replacement Warranty: Complete peace of mind with replacement coverage.',
      'Superior Glass Tubes: High-grade three-target ETC technology captures maximum heat.',
      'Insulated Storage Tank: Polyurethane Foam (PUF) insulation retains water temperature overnight.',
      'Rust-Resistant Tank: Inner storage tank crafted from food-grade Stainless Steel (SS 304).'
    ],
    specifications: {
      'System Capacities': '100 LPD, 200 LPD, 300 LPD, 500 LPD, 1000 LPD',
      'Tube Type': 'Borosilicate glass Evacuated Tube Collectors (ETC)',
      'Inner Tank Material': 'SS 304 Grade / Porcelain Enamel Coated',
      'Warranty Details': '5 Years comprehensive replacement warranty',
      'Optional Add-ons': 'Built-in electric heater backup and sacrificial anode rod'
    },
    faqs: [
      { q: 'Will I get hot water on cloudy days?', a: 'Our evacuated tubes absorb infrared radiation, meaning they can heat water even under light cloud cover. For prolonged rainy seasons, we can install a built-in backup thermostat heater.' },
      { q: 'How long does a typical installation take?', a: 'Usually, a standard rooftop installation is completed within 3 to 6 hours on a prepared level surface.' }
    ],
    basePrice: 26500,
    mrp: 30000,
    commissionType: 'percentage',
    commissionValue: 5,
    isActive: true
  },
  {
    slug: 'rowp',
    name: 'Commercial & Industrial RO Water Plants',
    category: 'RO Purification',
    image: 'https://i.postimg.cc/G4ZpYZDT/ro-plant.png',
    images: ['https://i.postimg.cc/G4ZpYZDT/ro-plant.png'],
    subtitle: 'High-Capacity Reverse Osmosis Systems',
    tagline: 'Industrial-grade water purification for commercial establishments, apartments, and schools.',
    description: 'Our commercial and industrial Reverse Osmosis (RO) plants provide highly optimized filtration. Utilizing multi-stage pre-filters (sand filter, activated carbon, and micron cartridges) and heavy-duty RO membranes, they remove up to 98% of total dissolved solids (TDS), heavy metals, viruses, and chemicals.',
    features: [
      'Multi-Stage Pre-Filtration: Removes suspended particles, chlorine, organic matter, and odor.',
      '98% TDS Reduction: Transforms high-salinity groundwater into clean, soft drinking water.',
      'Heavy-Duty Stainless Steel Skid: Sturdy SS 304 framework for maximum vibration dampening.',
      'Automatic Flush Valve: System auto-cleans membranes during startup to prevent scaling.',
      'Comprehensive Monitoring: Flow meters, pressure indicators, and TDS controllers included.'
    ],
    specifications: {
      'Plant Output': '250 LPH, 500 LPH, 1000 LPH, 2000 LPH up to 10,000 LPH',
      'Membrane Grade': 'High-rejection Dow Filmtec / Hydranautics membranes',
      'Skid Construction': 'Premium Grade SS 304 skid',
      'Operation Type': 'Semi-Automatic / Fully Automatic PLC Panels',
      'Raw Water TDS': 'Up to 3,000 ppm input tolerance'
    },
    faqs: [
      { q: 'What maintenance does a commercial RO plant require?', a: 'Requires regular sand and carbon filter backwashing (typically weekly) and changing the sediment cartridges every 1 to 2 months. Membranes last 2 to 3 years depending on usage.' },
      { q: 'Can we integrate this with an existing storage tank?', a: 'Yes, we can seamlessly connect the RO plant output directly to your building\'s overhead drinking water tank.' }
    ],
    basePrice: 85000,
    mrp: 95000,
    commissionType: 'percentage',
    commissionValue: 4,
    isActive: true
  },
  {
    slug: 'drop',
    name: 'Domestic RO Purifiers',
    category: 'RO Purification',
    image: 'https://placehold.co/400x300/00529B/FFFFFF?text=Domestic+RO',
    images: ['https://placehold.co/400x300/00529B/FFFFFF?text=Domestic+RO'],
    subtitle: 'Home RO + UV + UF + Alkaline Water Purifiers',
    tagline: 'Advanced multi-stage residential purification for safe, mineral-rich drinking water.',
    description: 'Ensure the health of your family with SBR\'s domestic RO purifiers. Combining Reverse Osmosis, UV sterilization, Ultra Filtration, and Alkaline mineral enrichers, these compact wall-mountable systems remove impurities while keeping essential minerals and maintaining a healthy pH level.',
    features: [
      '7-Stage Purification: Full filtration layout ensuring absolute purity.',
      'Active Copper & Alkaline Filter: Restores essential minerals like copper and calcium.',
      'UV Tank Sterilization: LED UV light in the storage tank prevents secondary bacteria growth.',
      'Sleek Food-Grade ABS Casing: Wall-mountable or table-top setup with clear level indicators.',
      'Input Water versatility: Purifies water from municipal taps, borewells, or water tankers.'
    ],
    specifications: {
      'Filtration Speed': '12 to 15 Liters per hour',
      'Storage Volume': '8 to 12 Liters active storage tank',
      'Purification Technology': 'RO + UV + UF + Active Copper + Alkaline',
      'Sensors': 'Auto-shutoff full tank sensor and dry run protection',
      'TDS Range': 'Handles input water up to 2,000 ppm'
    },
    faqs: [
      { q: 'Why is the alkaline filter important?', a: 'Standard RO systems can make water slightly acidic by removing minerals. Our alkaline filter restores trace minerals (Calcium, Magnesium, Copper) and raises the pH to a healthy alkaline range (7.5 - 8.5).' },
      { q: 'How often should filters be changed?', a: 'Sediment and carbon pre-filters should be replaced once a year, and the main RO membrane every 1.5 to 2 years.' }
    ],
    basePrice: 14500,
    mrp: 18000,
    commissionType: 'fixed',
    commissionValue: 800,
    isActive: true
  },
  {
    slug: 'sps',
    name: 'TATA Solar Power Systems',
    category: 'Solar Power',
    image: 'https://placehold.co/400x300/002D5B/FFC107?text=Solar+Power+System',
    images: ['https://placehold.co/400x300/002D5B/FFC107?text=Solar+Power+System'],
    subtitle: 'On-Grid, Off-Grid & Hybrid Rooftop Solar Systems',
    tagline: 'Generate your own clean electricity and reduce your power bills to zero.',
    description: 'Partnering with TATA Solar, we design and install high-quality rooftop solar installations for residential villas, schools, institutions, and industrial setups. Save up to 90% on electricity bills with government-approved net metering setups.',
    features: [
      'TATA Solar Quality: High-performance solar cells with exceptional degradation warranties.',
      'Net Metering Support: Complete assistance with grid synchronization, approvals, and subsidies.',
      'Instant Cost Reduction: drastially lower your residential or commercial monthly power bills.',
      '25-Year Performance Guarantee: Long-term panels built to deliver power for decades.',
      'Mobile Monitoring: Check solar generation statistics on your phone anytime.'
    ],
    specifications: {
      'System Capacities': '1 kW, 3 kW, 5 kW, 10 kW up to 100 kW',
      'Panel Technology': 'Mono-PERC Half-cut Cell high-efficiency panels',
      'Solar Inverter': 'High-efficiency Grid-tied / Hybrid solar inverters',
      'Mounting Structure': 'Anodized Aluminium / Galvanized Iron structure',
      'Grid Integration': 'Net-metering standard compliant'
    },
    faqs: [
      { q: 'What is the difference between On-grid and Off-grid systems?', a: 'On-grid systems send excess solar power to the government grid (using net metering to reduce bills), but shut down during blackouts for safety. Off-grid/Hybrid systems connect to batteries to store backup power for grid outages.' },
      { q: 'How much shadow-free space is required?', a: 'Typically, you need about 90 to 100 square feet of flat, shadow-free roof space per 1 kW of solar capacity.' }
    ],
    basePrice: 140000,
    mrp: 160000,
    commissionType: 'percentage',
    commissionValue: 3,
    isActive: true
  },
  {
    slug: 'fse',
    name: 'Fenice Solar Energy Solutions',
    category: 'Solar Power',
    image: 'https://placehold.co/400x300/002D5B/FFC107?text=Fenice+Solar',
    images: ['https://placehold.co/400x300/002D5B/FFC107?text=Fenice+Solar'],
    subtitle: 'High-Efficiency Photovoltaic Modular Systems',
    tagline: 'Next-generation solar technology for heavy commercial and industrial properties.',
    description: 'The Fenice Solar Energy System is a cutting-edge photovoltaic solution designed for maximum power extraction. Utilizing high-efficiency cells that capture diffused light even under low-radiation cloudy conditions, it is the perfect fit for industrial plants and modern green architectural designs.',
    features: [
      'Low-Light Efficiency: Produces electricity during overcast and rainy seasons.',
      'Modular Solar String Layout: Allows quick scalability and clean wiring structures.',
      'Thermal Management: Custom bypass diodes minimize output loss from partial shadow.',
      'Tough Load Certifications: High wind and snow resistance for rooftop durability.',
      'Precision String Monitoring: Instant performance notifications for predictive maintenance.'
    ],
    specifications: {
      'Panel Wattage': '450W to 550W modules',
      'Cell Type': 'N-Type Monocrystalline Photovoltaic Cells',
      'Module Efficiency': 'Up to 21.8% efficiency rating',
      'Junction Box Rating': 'IP68 dust and water proof',
      'Operating Temperature': '-40°C to +85°C'
    },
    faqs: [
      { q: 'What makes Fenice N-type cells superior?', a: 'N-type monocrystalline cells have a lower degradation rate over time and are less affected by heat, yielding more kilowatt-hours of power per year than standard P-type panels.' },
      { q: 'Can SBR help with solar loans?', a: 'Yes, we partner with major local banks to offer solar finance options with simple documentation.' }
    ],
    basePrice: 165000,
    mrp: 185000,
    commissionType: 'percentage',
    commissionValue: 3.5,
    isActive: true
  },
  {
    slug: 'hp',
    name: 'Racold & Sun-Max Heat Pumps',
    category: 'Heat Pumps',
    image: 'https://i.postimg.cc/XZzp2ptq/heat-pump.png',
    images: ['https://i.postimg.cc/XZzp2ptq/heat-pump.png'],
    subtitle: 'Centralized Thermodynamic Water Heating Systems',
    tagline: 'Save up to 70% in power bills compared to standard electric water heaters.',
    description: 'Get energy-efficient water heating with centralized heat pumps from Racold and Sun-Max. Using a thermodynamic refrigeration cycle, heat pumps extract heat from the surrounding air and transfer it directly to your water supply, providing 24/7 hot water at a fraction of the cost of standard electric heaters.',
    features: [
      '70% Electricity Savings: Thermodynamic cycle heats water with minimal power consumption.',
      'Centralized hot water: Single rooftop heat pump supplies hot water to all bathrooms.',
      'All-Weather Operation: Functions day and night, in rains or winters, unlike solar heaters.',
      'Eco-Friendly: Low carbon footprint using environmentally friendly refrigerant.',
      'Digital Control Panel: Program temperature and cycles dynamically.'
    ],
    specifications: {
      'Brands Offered': 'Racold, Sun-Max',
      'Tank Capacities': '150 L, 200 L, 300 L, 500 L up to 2000 L',
      'Power Source': 'Thermodynamic Air-to-Water heat exchanger',
      'COP Rating': 'High Coefficient of Performance ~ 4.0'
    },
    faqs: [
      { q: 'Does a heat pump work during cold winters?', a: 'Yes. Modern heat pumps extract ambient thermal energy even at temperatures down to 5°C, making them extremely effective year-round.' },
      { q: 'Can it be connected to existing bathroom pipelines?', a: 'Yes, as long as your building has a centralized hot water plumbing loop, the heat pump mounts easily on your roof.' }
    ],
    basePrice: 65000,
    mrp: 75000,
    commissionType: 'fixed',
    commissionValue: 2000,
    isActive: true
  }
];

// Helper to generate slug from name
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// @desc    Seed initial products
exports.seedDefaultProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(defaultProducts);
      console.log('Default products seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding default products:', error.message);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public (filtered by isActive for non-admins)
exports.getProducts = async (req, res) => {
  try {
    const { category, activeOnly } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (activeOnly === 'true' || !req.user || req.user.role !== 'admin') {
      query.isActive = true;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:identifier
// @access  Public
exports.getProductByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    let product;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    } else {
      product = await Product.findOne({ slug: identifier });
    }

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products/admin
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    let { slug, name, category, image, images, subtitle, tagline, description, features, specifications, faqs, basePrice, mrp, commissionType, commissionValue, isActive } = req.body;

    if (!name || !category || !image) {
      return res.status(400).json({ success: false, error: 'Name, Category, and primary Image are required.' });
    }

    if (!slug) {
      slug = slugify(name);
    }

    // Ensure uniqueness of slug
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure images array contains primary image if empty
    if (!images || images.length === 0) {
      images = [image];
    } else if (!images.includes(image)) {
      images.unshift(image);
    }

    const product = await Product.create({
      slug,
      name,
      category,
      image,
      images,
      subtitle: subtitle || '',
      tagline: tagline || '',
      description: description || '',
      features: features || [],
      specifications: specifications || {},
      faqs: faqs || [],
      basePrice: Number(basePrice) || 0,
      mrp: Number(mrp) || 0,
      commissionType: commissionType || 'fixed',
      commissionValue: Number(commissionValue) || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/admin/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (req.body.name && (!req.body.slug || req.body.slug === product.slug)) {
      req.body.slug = slugify(req.body.name);
    }

    // Synchronize image and images array
    if (req.body.image && req.body.images) {
      if (!req.body.images.includes(req.body.image)) {
        req.body.images.unshift(req.body.image);
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/admin/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
