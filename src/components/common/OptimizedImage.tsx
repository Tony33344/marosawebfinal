import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onClick?: () => void;
}

/**
 * OptimizedImage component with:
 * - WebP support with fallback
 * - Lazy loading with Intersection Observer
 * - Blur placeholder while loading
 * - Responsive srcset generation
 * - Proper width/height to prevent CLS
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '100vw',
  onLoad,
  onClick
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLPictureElement>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string): string => {
    const widths = [320, 480, 640, 768, 1024, 1280, 1536];
    // For now, we'll use the same image but this could be enhanced
    // to use image CDN or build-time generation
    return widths
      .filter(w => w <= width * 2)
      .map(w => `${baseSrc} ${w}w`)
      .join(', ');
  };

  // Generate WebP source if original is not WebP
  const isWebP = src.toLowerCase().endsWith('.webp');
  const webpSrc = isWebP ? src : src.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');

  return (
    <picture
      ref={imgRef}
      className={`block relative overflow-hidden ${className}`}
      style={{
        aspectRatio: `${width} / ${height}`
      }}
      onClick={onClick}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-lg scale-110"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundColor: !blurDataURL ? '#e7e5e4' : undefined
          }}
          aria-hidden="true"
        />
      )}

      {placeholder === 'empty' && !isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-200">
          <svg
            className="w-12 h-12 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <>
          {/* WebP source */}
          {!isWebP && (
            <source
              type="image/webp"
              srcSet={webpSrc}
              sizes={sizes}
            />
          )}

          {/* Original format fallback */}
          <img
            src={src}
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ aspectRatio: `${width} / ${height}` }}
          />
        </>
      )}
    </picture>
  );
};

/**
 * Hero image with priority loading
 */
export const HeroImage: React.FC<Omit<OptimizedImageProps, 'priority'>> = (props) => (
  <OptimizedImage {...props} priority={true} placeholder="blur" />
);

/**
 * Product thumbnail with lazy loading
 */
export const ProductThumbnail: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, alt, className, onClick }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={300}
    height={300}
    className={className}
    onClick={onClick}
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  />
);

export default OptimizedImage;
