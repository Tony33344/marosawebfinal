import { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageUtils';

interface ImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  decoding?: 'sync' | 'async' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  srcSet?: string;
  role?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

/**
 * A reusable Image component that handles errors gracefully
 * and provides a consistent interface for images across the application.
 * 
 * Enhanced with:
 * - Required width and height to prevent layout shifts
 * - Improved accessibility attributes
 * - Modern image optimization attributes
 */
export function Image({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  className = '',
  width = 'auto',
  height = 'auto',
  loading = 'lazy',
  onClick,
  decoding = 'async',
  fetchPriority,
  sizes,
  srcSet,
  role,
  ariaLabel,
  style
}: ImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Reset error state when src changes
    setError(false);
    setIsLoaded(false);

    // For gallery images that are already processed, use them directly
    if (src.startsWith('http://') || src.startsWith('https://')) {
      console.log('Using pre-processed URL directly:', src);
      setImageSrc(src);
    } else {
      // Process the image URL for other images
      const processedSrc = getImageUrl(src, fallbackSrc);
      console.log(`Processed image URL from ${src} to ${processedSrc}`);
      setImageSrc(processedSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    console.warn(`Image failed to load: ${imageSrc}`);
    setError(true);

    // Only set fallback if we're not already using it
    if (imageSrc !== fallbackSrc) {
      const processedFallback =
        fallbackSrc.startsWith('http://') || fallbackSrc.startsWith('https://')
          ? fallbackSrc
          : getImageUrl(fallbackSrc, fallbackSrc);
      setImageSrc(processedFallback);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Determine if this is a decorative image (no alt text or explicitly marked as decorative)
  const isDecorative = alt === '' || role === 'presentation';

  return (
    <img
      src={error
        ? (fallbackSrc.startsWith('http://') || fallbackSrc.startsWith('https://')
            ? fallbackSrc
            : getImageUrl(fallbackSrc, fallbackSrc))
        : imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
      width={width}
      height={height}
      loading={loading}
      onClick={onClick}
      onError={handleError}
      onLoad={handleLoad}
      decoding={decoding}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
      sizes={sizes}
      srcSet={srcSet}
      role={isDecorative ? 'presentation' : role}
      aria-label={ariaLabel}
      aria-hidden={isDecorative}
      style={style}
    />
  );
}
