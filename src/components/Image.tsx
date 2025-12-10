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
  const [imageSrc, setImageSrc] = useState<string>(() => {
    if (!src) {
      // If no src is provided, fall back immediately
      return fallbackSrc.startsWith('http://') || fallbackSrc.startsWith('https://')
        ? fallbackSrc
        : getImageUrl(fallbackSrc, fallbackSrc);
    }

    // For pre-processed absolute URLs, use them directly
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }

    // For other paths, process via getImageUrl immediately so we don't render with an empty src
    return getImageUrl(src, fallbackSrc);
  });
  const [error, setError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    // Reset error state when src changes
    setError(false);
    setIsLoaded(false);
    setRetryCount(0);

    if (!src) {
      // When src is empty, immediately use the fallback image
      const processedFallback =
        fallbackSrc.startsWith('http://') || fallbackSrc.startsWith('https://')
          ? fallbackSrc
          : getImageUrl(fallbackSrc, fallbackSrc);
      setImageSrc(processedFallback);
      return;
    }

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
    if (!imageSrc) {
      // If we somehow have an empty src, just switch to fallback silently
      const processedFallback =
        fallbackSrc.startsWith('http://') || fallbackSrc.startsWith('https://')
          ? fallbackSrc
          : getImageUrl(fallbackSrc, fallbackSrc);
      setImageSrc(processedFallback);
      return;
    }

    console.warn(`Image failed to load: ${imageSrc}`);

    // For remote images (Supabase, ibb.co, etc.), try up to 3 retries before falling back to placeholder
    if (imageSrc && retryCount < 3 && (imageSrc.includes('supabase.co') || imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
      console.warn('Retrying image load before using placeholder, attempt', retryCount + 1);
      setRetryCount(prev => prev + 1);
      setError(false);
      setIsLoaded(false);
      // Trigger a reload by resetting the src state
      setImageSrc(prev => prev);
      return;
    }

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
      className={className}
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
