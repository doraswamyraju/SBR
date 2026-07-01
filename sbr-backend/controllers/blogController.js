const Blog = require('../models/Blog');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find().sort({ publishedAt: -1 });
    res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private (Admin)
exports.createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'A blog post with this URL slug already exists.' });
    }
    next(err);
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Admin)
exports.updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.body._id || req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'A blog post with this URL slug already exists.' });
    }
    next(err);
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Admin)
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// Seed default blogs if database is empty
exports.seedDefaultBlogs = async () => {
  try {
    const count = await Blog.countDocuments();
    if (count === 0) {
      const defaults = [
        {
          title: "5 Signs It's Time to Switch to a Solar Water Heater",
          slug: "5-signs-switch-to-solar-water-heater",
          category: "Solar Power",
          summary: "Discover the key signs indicating your traditional geyser is ready for replacement, and why switching to solar can save money.",
          content: "<p>In our busy daily lives, hot water is an essential need for bathing, washing dishes, and other household tasks. However, relying on traditional electric geysers can result in skyrocketing electricity bills and frequent maintenance issues. If you notice any of these signs, it's time to upgrade to a modern, high-efficiency solar water heater.</p><h3>1. Consistently High Electricity Bills</h3><p>Electric water heaters are major power consumers. If your monthly energy bills are soaring, switching to solar water heating can reduce your heating bills to zero since sunlight is free.</p><h3>2. Frequent Repairs & Leakage</h3><p>Are you constantly calling mechanics to repair heating coils or address tank rust leaks? SBR's solar water heaters feature food-grade Stainless Steel (SS 304) inner tanks and come with a 5-year replacement guarantee, giving you complete peace of mind.</p><h3>3. Insufficient Hot Water for the Family</h3><p>If the hot water runs out halfway through morning baths, you need a high-capacity system. SBR solar systems range from 100 LPD (Liters Per Day) to 500 LPD+ options, with thick PUF insulation that keeps water hot overnight.</p><h3>4. Hard Water Corrosion Damage</h3><p>In regions like Tirupati, hard water accelerates coil scaling and tank decay. Solar ETC systems operate effectively with hard water without scaling the heating mechanism itself.</p><h3>5. A Commitment to Green Living</h3><p>Switching to solar water heaters reduces your household carbon footprint by thousands of kilograms of CO2 annually. Take the first step towards a sustainable, clean future with Sri Balaji Renewables today!</p>",
          image: "https://i.postimg.cc/CZp2b16T/solar-water-heater.png",
          author: "John Doe"
        },
        {
          title: "Understanding Hard Water vs. Soft Water",
          slug: "understanding-hard-water-vs-soft-water",
          category: "Water Purification",
          summary: "Learn the differences between hard and soft water, their impact on your health, skin, hair, and home appliances.",
          content: "<p>Water is the lifeblood of our homes, but not all water is created equal. Depending on where you live, the water flowing from your tap might be 'hard' or 'soft.' Understanding the difference between these two states is key to protecting your family's health and preserving the life of your household plumbing and expensive fittings.</p><h3>What is Hard Water?</h3><p>Hard water contains high concentrations of dissolved minerals, primarily Calcium and Magnesium. As rain filters through soil and rocks like limestone, it naturally accumulates these minerals. While safe to drink, hard water causes aggressive scaling inside pipes, white stains on taps, reduces soap lathering, and leads to dry skin and hair fall.</p><h3>What is Soft Water?</h3><p>Soft water has low levels of Calcium and Magnesium. It lather easily with soap, leaves no residue on dishes or bathroom tiles, and is much gentler on skin and hair, helping maintain natural moisture levels.</p><h3>How SBR Helps You Combat Hard Water</h3><p>At Sri Balaji Renewables, we specialize in advanced water conditioning and softening solutions:<ul><li><strong>Automatic Water Softeners:</strong> Utilize high-efficiency ion-exchange resins (from Zero-B, 3M, and Pentair) to completely replace calcium/magnesium with sodium, providing 100% soft water.</li><li><strong>HM Hard Water Scalenors:</strong> An eco-friendly, salt-free electrolysis system that captures ~70% of scale minerals before they enter your overhead tank, offering a zero-wastage solution.</li></ul></p>",
          image: "https://i.postimg.cc/BPjpr9wB/softener.png",
          author: "Jane Smith"
        },
        {
          title: "The Benefits of a Maintenance-Free Scalenor",
          slug: "benefits-maintenance-free-scalenor",
          category: "Energy Savings",
          summary: "Learn how SBR's HM Hard Water Scalenor works using electrolysis to condition scale without salts or water wastage.",
          content: "<p>For homeowners in high-hardness regions, traditional salt-based softeners have long been the standard. However, they come with substantial drawbacks: constant salt replenishment, regular regeneration monitoring, and significant water rejection. Sri Balaji Renewables is proud to offer a modern alternative: the Maintenance-Free HM Hard Water Scalenor.</p><h3>How it Works</h3><p>Installed directly on the inlet pipe before your overhead tank, the HM Scalenor uses physical conditioning and electrolysis. As water passes through the chamber, low-voltage electrical currents aggregate calcium and magnesium ions into micro-crystals, collecting them directly on the internal electrodes. This prevents the scale from binding to your pipes, geyser elements, and taps.</p><h3>Key Benefits:</h3><ul><li><strong>Zero Water Wastage:</strong> Standard softeners reject hundreds of liters of water during regeneration. The HM Scalenor has 0% water wastage.</li><li><strong>Chemical-Free & Salt-Free:</strong> Keeps your drinking water natural and sodium-free. Safe for gardening and consumption.</li><li><strong>Virtually Zero Maintenance:</strong> There are no salt tablets to purchase. Simply rinse the core with normal water once every 1 to 3 months.</li><li><strong>Complete System Protection:</strong> Safeguards your household plumbing network, bathroom glass, solar heaters, and washing machines.</li></ul>",
          image: "https://i.postimg.cc/sQDwJZY8/scalenor.png",
          author: "Peter Jones"
        }
      ];
      await Blog.create(defaults);
      console.log('Seeded default blog posts.');
    }
  } catch (err) {
    console.error(`Failed to seed default blogs: ${err.message}`);
  }
};
