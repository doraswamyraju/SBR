import React, { useState, useEffect } from 'react';

// --- SVG Icons ---
const IconCalendar = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconUser = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconTag = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconArrowLeft = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;

const BlogDetail = ({ slug, handleNavigation }) => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Service Booking states in sidebar
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/blogs/${slug}`);
        const result = await response.json();
        if (result.success) {
          setBlog(result.data);
        } else {
          setError(result.error || 'Blog post not found.');
        }
      } catch (err) {
        setError('Failed to fetch blog post details.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

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
          serviceType: 'Consultation Request',
          description: `User requested contact after reading blog: "${blog?.title || slug}"`
        })
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', phone: '', address: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-brand-light-blue">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading article...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-6 py-20 text-center min-h-[60vh]">
        <h2 className="text-3xl font-bold text-brand-dark-blue mb-4">Article Not Found</h2>
        <p className="text-gray-600 mb-8">{error || 'The blog post you are looking for does not exist or has been removed.'}</p>
        <button onClick={() => handleNavigation('home')} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-full hover:bg-brand-dark-blue transition duration-300">
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-light-blue min-h-screen">
      {/* Blog Hero Section */}
      <section className="relative py-20 bg-brand-dark-blue text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark-blue to-brand-blue/80 opacity-95"></div>
        <div className="container mx-auto px-6 relative z-10">
          <button 
            onClick={() => handleNavigation('home')}
            className="flex items-center text-blue-200 hover:text-brand-yellow font-semibold text-sm mb-6 transition-colors"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </button>
          
          <div className="max-w-4xl">
            <span className="bg-brand-yellow text-brand-dark-blue font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-4 inline-block">
              {blog.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
              {blog.title}
            </h1>
            
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-blue-100">
              <div className="flex items-center">
                <IconUser className="h-4 w-4 mr-2 text-brand-yellow" />
                <span>By {blog.author}</span>
              </div>
              <div className="flex items-center">
                <IconCalendar className="h-4 w-4 mr-2 text-brand-yellow" />
                <span>{formatDate(blog.publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Featured Image */}
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={blog.image} 
                  alt={blog.title} 
                  className="w-full max-h-[450px] object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/800x450/CCCCCC/333333?text=SBR+Blog';
                  }}
                />
              </div>

              {/* Summary block */}
              <blockquote className="border-l-4 border-brand-yellow bg-brand-light-blue/40 p-4 rounded-r-lg text-gray-700 italic text-lg leading-relaxed">
                {blog.summary}
              </blockquote>

              {/* Main Content HTML Render */}
              <article 
                className="prose max-w-none text-gray-800 text-md md:text-lg leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>

            {/* Right Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Quick Inquiry Form */}
              <div className="bg-brand-dark-blue text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-brand-blue/30 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <h3 className="text-xl font-bold text-brand-yellow mb-2">Interested in Solar or Water Upgrades?</h3>
                <p className="text-blue-100 text-sm mb-6">Enter your details below and an SBR technical expert will contact you for a free consultation.</p>

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
                      placeholder="Enter Phone Number" 
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-blue-200 font-bold mb-1">Location</label>
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

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-brand-yellow text-brand-dark-blue font-bold py-2.5 rounded-lg hover:bg-yellow-500 transition duration-300 shadow-md text-sm uppercase tracking-wider"
                  >
                    {isSubmitting ? 'Sending...' : 'Request Free Call'}
                  </button>

                  {submitStatus === 'success' && (
                    <div className="bg-green-500/25 border border-green-500 text-green-300 rounded-lg p-3 text-center text-xs font-semibold mt-2">
                      Inquiry received! SBR team will contact you shortly.
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="bg-red-500/25 border border-red-500 text-red-300 rounded-lg p-3 text-center text-xs font-semibold mt-2">
                      Submission failed. Please call +91-9848182595 directly.
                    </div>
                  )}
                </form>
              </div>

              {/* SBR Brand Promo Card */}
              <div className="bg-brand-light-blue rounded-xl p-6 border border-gray-200/60 text-center">
                <h4 className="font-bold text-brand-dark-blue text-lg mb-2">Sri Balaji Renewables</h4>
                <p className="text-gray-600 text-sm mb-4">Your trusted partner for sustainable solar and water descaling solutions in Tirupati since 1998.</p>
                <button 
                  onClick={() => handleNavigation('products')}
                  className="bg-brand-blue text-white text-xs font-bold py-2 px-6 rounded-full hover:bg-brand-dark-blue transition-colors"
                >
                  Explore All Products
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogDetail;
