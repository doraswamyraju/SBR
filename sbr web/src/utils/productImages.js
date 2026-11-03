// Helper to generate a reliable inline SVG placeholder or known product image
export const getProductImageUrl = (product) => {
  if (!product) return getInlineProductSvg('Product');
  
  // 1. If explicit real image uploaded or provided (and not a placehold.co link that might fail or look blank)
  if (product.image && !product.image.includes('placehold.co')) {
    return product.image;
  }

  // 2. Map known names to real brand photos
  const lower = (product.name || '').toLowerCase();
  if (lower.includes('scalenor')) {
    return 'https://i.postimg.cc/sQDwJZY8/scalenor.png';
  }
  if (lower.includes('softener')) {
    return 'https://i.postimg.cc/BPjpr9wB/softener.png';
  }
  if (lower.includes('solar water') || lower.includes('water heater') || lower.includes('spc solar')) {
    return 'https://i.postimg.cc/CZp2b16T/solar-water-heater.png';
  }
  if (lower.includes('ro plant') || lower.includes('commercial ro')) {
    return 'https://i.postimg.cc/G4ZpYZDT/ro-plant.png';
  }
  if (lower.includes('heat pump')) {
    return 'https://i.postimg.cc/XZzp2ptq/heat-pump.png';
  }

  // 3. If product has any images array item that isn't placeholder
  if (Array.isArray(product.images)) {
    const validImg = product.images.find(img => img && !img.includes('placehold.co'));
    if (validImg) return validImg;
  }

  // 4. Return modern, lightweight inline SVG badge (never broken, zero external network dependency)
  return getInlineProductSvg(product.name || 'SBR Product', product.category);
};

export const getInlineProductSvg = (title = 'Product', category = 'Water & Solar Solutions') => {
  const cleanTitle = (title || 'Product').substring(0, 24);
  const cleanCategory = (category || 'SBR Solutions').substring(0, 28);
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#002D5B"/>
        <stop offset="100%" stop-color="#00529B"/>
      </linearGradient>
      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFC107" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#FFD54F" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" rx="16" fill="url(#bgGrad)"/>
    <circle cx="200" cy="115" r="48" fill="#ffffff" fill-opacity="0.08"/>
    <circle cx="200" cy="115" r="32" fill="#FFC107" fill-opacity="0.15"/>
    <path d="M185 125 L200 95 L215 125 Z" fill="#FFC107"/>
    <circle cx="200" cy="120" r="5" fill="#ffffff"/>
    <rect x="60" y="175" width="280" height="2" fill="url(#glowGrad)"/>
    <text x="200" y="210" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="18" font-weight="700" text-anchor="middle" letter-spacing="0.5">${cleanTitle}</text>
    <text x="200" y="235" fill="#93C5FD" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="500" text-anchor="middle">${cleanCategory}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

