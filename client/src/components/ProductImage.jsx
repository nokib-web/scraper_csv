import React, { useState } from 'react';

export default function ProductImage({ src, alt = 'Product', className = 'w-full h-full object-cover', size = 'sm' }) {
  const [hasError, setHasError] = useState(false);

  const initial = (alt || 'P').trim().charAt(0).toUpperCase();

  if (!src || hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-neutral-900 text-[#F1FF0A] font-extrabold select-none ${
        size === 'lg' ? 'text-4xl' : (size === 'md' ? 'text-base' : 'text-xs')
      }`}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
