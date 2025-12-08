/**
 * Utility functions for handling image paths and image management
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Define allowed image domains for security
const ALLOWED_IMAGE_DOMAINS = [
  'i.ibb.co',
  'images.unsplash.com',
  'source.unsplash.com',
  'vibrantplate.com',
  'squarespace-cdn.com',
  'blogger.googleusercontent.com',
  'pixabay.com',
  'verywellhealth.com',
  'sakiproducts.com',
  'simplybeyondherbs.com',
  'duckduckgo.com',
  'jernejkitchen.com',
  'googleusercontent.com',
  'thefeedfeed.com',
  'dreamstime.com',
  'tse4.mm.bing.net',
  'bp.blogspot.com',
  'forbes.com',
  'urbanfarmingzone.com',
  'littlesunnykitchen.com',
  'treehugger.com',
  'delo.si',
  'onaplus.delo.si',
  'marosakreditna.netlify.app',
  // Additional domains for recipes and product images
  'www.vibrantplate.com',
  'www.littlesunnykitchen.com',
  'www.treehugger.com',
  'www.onaplus.delo.si',
  'www.delo.si',
  'cdn.pixabay.com',
  'media.istockphoto.com',
  'www.istockphoto.com',
  'img.freepik.com',
  'www.freepik.com',
  'www.pexels.com',
  'images.pexels.com',
  'www.shutterstock.com',
  'image.shutterstock.com',
  'ibb.co'
];

// Default fallback image URL
const DEFAULT_FALLBACK_IMAGE = '/images/placeholder-product.jpg';

/**
 * Converts a local image path to a URL that can be used in the browser
 * Handles paths with spaces and other special characters
 *
 * @param path The image path (can start with './', '/', or '../')
 * @param fallbackUrl Optional fallback URL if the image can't be loaded
 * @returns A URL that can be used in the browser
 */
export function getImageUrl(path: string, fallbackUrl: string = DEFAULT_FALLBACK_IMAGE): string {
  if (!path) {
    return fallbackUrl;
  }

  try {
    const supabaseUrl = SUPABASE_URL;

    // If Supabase is configured and the path looks like one of our local images,
    // build a URL to the public "marosaimages" storage bucket instead of serving
    // directly from the Vite public folder. This works for:
    // - "/images/..."
    // - "./images/..."
    // - "../images/..."
    if (
      supabaseUrl &&
      (path.startsWith('/images/') || path.startsWith('./images/') || path.startsWith('../images/'))
    ) {
      // Normalize the path to a storage object key like "images/..."
      let storagePath = path;

      if (storagePath.startsWith('./')) {
        storagePath = storagePath.substring(2);
      }

      if (storagePath.startsWith('../')) {
        storagePath = storagePath.replace(/^\.\.\//, '');
      }

      if (storagePath.startsWith('/')) {
        storagePath = storagePath.substring(1);
      }

      // Encode each segment so spaces and special characters are safe in the URL
      const encodedPath = storagePath
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');

      // Public bucket URL for Supabase Storage
      return `${supabaseUrl}/storage/v1/object/public/marosaimages/${encodedPath}`;
    }

    // Handle local paths that start with './'
    if (path.startsWith('./')) {
      const relativePath = path.substring(2);
      try {
        // First, normalize the path to handle case sensitivity issues
        // This is especially important for paths like './images/melisa/1.jpg' vs './images/Melisa/1.jpg'
        const normalizedPath = relativePath.replace(/\/melisa\//i, '/Melisa/');

        // Encode the path to handle spaces and special characters
        const encodedPath = normalizedPath.split('/').map(segment => encodeURIComponent(segment)).join('/');

        // Try the import.meta.url approach first (works in dev)
        return new URL(encodedPath, import.meta.url).href;
      } catch (error) {
        // Fallback to absolute path (more reliable in production)
        const baseUrl = window.location.origin;

        // Normalize the path to handle case sensitivity issues
        const normalizedPath = relativePath.replace(/\/melisa\//i, '/Melisa/');

        // Encode the path to handle spaces and special characters
        // Special handling for paths with spaces - don't encode spaces in "paket 3.jpg" style filenames
        const encodedPath = normalizedPath.split('/').map(segment => {
          // If the segment contains "paket" and has spaces, preserve the spaces
          if (segment.toLowerCase().includes('paket') && segment.includes(' ')) {
            return segment;
          }
          return encodeURIComponent(segment);
        }).join('/');

        return `${baseUrl}/${encodedPath}`;
      }
    }

    // Handle relative paths that start with '../'
    if (path.startsWith('../')) {
      // Convert '../images/melisa/1.jpg' to '/images/melisa/1.jpg'
      // This assumes that the path is relative to the current directory
      // and we want to make it relative to the public directory
      const absolutePath = path.replace(/^\.\.\//, '/');

      // Normalize the path to handle case sensitivity issues
      const normalizedPath = absolutePath.replace(/\/melisa\//i, '/Melisa/');

      const baseUrl = window.location.origin;

      // Encode the path to handle spaces and special characters
      // Special handling for paths with spaces - don't encode spaces in "paket 3.jpg" style filenames
      const encodedPath = normalizedPath.split('/').map(segment => {
        // If the segment contains "paket" and has spaces, preserve the spaces
        if (segment.toLowerCase().includes('paket') && segment.includes(' ')) {
          return segment;
        }
        return encodeURIComponent(segment);
      }).join('/');

      return `${baseUrl}${encodedPath}`;
    }

    // Handle absolute paths that start with '/'
    if (path.startsWith('/')) {
      // For absolute paths, we need to use the base URL of the application
      const baseUrl = window.location.origin;

      // First, clean up the path by removing any existing encoding
      // Replace all %20 with spaces first to avoid double encoding
      let cleanPath = path.replace(/%20/g, ' ');
      
      // Remove any surrounding quotes or curly braces that might be in the path
      cleanPath = cleanPath.replace(/^['"{]+|['"}]+$/g, '');

      // Normalize the path to handle case sensitivity issues for known folders
      let normalizedPath = cleanPath;
      console.log('Before normalization:', normalizedPath);
      
      // Handle Melisa folder (should be capitalized)
      // This handles both '/melisa/' and 'melisa/' at the start of the path
      normalizedPath = normalizedPath
        .replace(/^\/melisa\//i, '/Melisa/')
        .replace(/(^|[^/])\/melisa\//i, '$1/Melisa/')
        .replace(/(^|[^/])\/melisa($|\?|#)/i, '$1/Melisa$2');
      
      // Handle other known folders
      normalizedPath = normalizedPath
        .replace(/\/konopljino olje\//gi, '/konopljino olje/')
        .replace(/\/poprova meta\//gi, '/Poprova meta/');
        
      console.log('After normalization:', normalizedPath);

      // Encode the path to handle spaces and special characters
      console.log('Splitting path:', normalizedPath);
      const encodedPath = normalizedPath.split('/').map(segment => {
        // Skip empty segments (like the first empty string from splitting on leading '/') 
        if (!segment) return '';
        
        // Special handling for paths with spaces in known folders
        const lowerSegment = segment.toLowerCase();
        if (lowerSegment.includes(' ')) {
          if (lowerSegment === 'konopljino olje' || 
              lowerSegment === 'poprova meta' ||
              lowerSegment === 'melisa' ||
              lowerSegment.includes('paket') ||
              lowerSegment.includes('čaj')) {
            // Use the correct case for known folders
            if (lowerSegment === 'poprova meta') return 'Poprova meta';
            if (lowerSegment === 'melisa') return 'Melisa';
            if (lowerSegment === 'konopljino olje') return 'konopljino olje';
            return segment;
          }
        }
        
        // For all other segments, encode them
        return encodeURIComponent(segment);
      }).filter(segment => segment !== '').join('/');

      // Ensure we don't have double slashes
      const finalPath = `/${encodedPath}`.replace(/\/+/g, '/');
      
      // Log the final URL for debugging
      console.log(`Generated image URL from path: ${path} -> ${baseUrl}${finalPath}`);
      
      return `${baseUrl}${finalPath}`;
    }

    // If it's already a URL (http:// or https://), return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Ensure HTTPS for security
      const secureUrl = path.replace(/^http:\/\//i, 'https://');

      // Check if the domain is allowed
      const url = new URL(secureUrl);
      const domain = url.hostname;

      // More flexible domain checking - check if any allowed domain is part of the hostname
      if (ALLOWED_IMAGE_DOMAINS.some(allowedDomain =>
          domain === allowedDomain ||
          domain.endsWith(`.${allowedDomain}`) ||
          allowedDomain.endsWith(domain)
      )) {
        return secureUrl;
      } else {
        console.warn(`Image domain not in allowed list: ${domain}`);
        // Try to load the image anyway, but log a warning
        // This helps with new domains that might not be in the allowed list yet
        return secureUrl;
      }
    }

    // If it's a relative path without './' prefix, add the base URL
    const baseUrl = window.location.origin;

    // Normalize the path to handle case sensitivity issues
    const normalizedPath = path.replace(/\/melisa\//i, '/Melisa/');

    // Encode the path to handle spaces and special characters
    // Special handling for paths with spaces - don't encode spaces in "paket 3.jpg" style filenames
    const encodedPath = normalizedPath.split('/').map(segment => {
      // If the segment contains "paket" and has spaces, preserve the spaces
      if (segment.toLowerCase().includes('paket') && segment.includes(' ')) {
        return segment;
      }
      return encodeURIComponent(segment);
    }).join('/');

    return `${baseUrl}/${encodedPath}`;
  } catch (error) {
    console.error('Error creating URL from path:', path, error);
    // Last resort fallback
    return fallbackUrl;
  }
}

/**
 * Validates an image URL by checking if it's accessible
 *
 * @param url The image URL to validate
 * @returns Promise that resolves to true if the image is valid, false otherwise
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;

  // Check cache first to avoid repeated validation
  const cacheKey = `img_valid_${url}`;
  const cachedResult = sessionStorage.getItem(cacheKey);
  if (cachedResult) {
    return cachedResult === 'true';
  }

  try {
    // For local images, just check if the path starts with '/' or contains the origin
    if (url.startsWith('/') || url.includes(window.location.origin)) {
      // Log validation for debugging
      console.log('Validating local image path:', url);

      // Check if the URL contains placeholder.svg - if so, it's not valid
      if (url.includes('placeholder.svg')) {
        console.warn('Placeholder image detected, marking as invalid:', url);
        sessionStorage.setItem(cacheKey, 'false');
        return false;
      }

      // Special handling for "paket 3.jpg" style filenames
      if (url.includes('paket') && url.includes(' ')) {
        console.log('Validating special paket image path:', url);
      }

      // For local images, we'll assume they exist but could add a more robust check
      sessionStorage.setItem(cacheKey, 'true');
      return true;
    }

    // Use Image object to validate instead of fetch for better reliability
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        sessionStorage.setItem(cacheKey, 'true');
        resolve(true);
      };

      img.onerror = () => {
        console.warn(`Image failed to load: ${url}`);
        sessionStorage.setItem(cacheKey, 'false');
        resolve(false);
      };

      // Set crossOrigin to anonymous to avoid CORS issues
      img.crossOrigin = 'anonymous';
      img.src = url;

      // Set a timeout to avoid hanging if the image takes too long to load
      setTimeout(() => {
        if (!img.complete) {
          console.warn(`Image load timeout: ${url}`);
          sessionStorage.setItem(cacheKey, 'false');
          resolve(false);
        }
      }, 5000); // 5 second timeout
    });
  } catch (error) {
    console.error('Error validating image URL:', url, error);
    sessionStorage.setItem(cacheKey, 'false');
    return false;
  }
}

/**
 * Handles multiple product images, ensuring they are valid and accessible
 *
 * @param mainImage The main product image URL
 * @param additionalImages Array of additional image URLs
 * @returns Object containing validated main image and additional images
 */
export async function processProductImages(
  mainImage: string | undefined,
  additionalImages: string[] | undefined
): Promise<{ mainImageUrl: string, validAdditionalImages: string[] }> {
  console.log('Processing images - Main image:', mainImage);
  console.log('Processing images - Additional images:', additionalImages);

  // Process main image
  const mainImageUrl = mainImage ? getImageUrl(mainImage) : DEFAULT_FALLBACK_IMAGE;
  console.log('Main image URL after processing:', mainImageUrl);

  // Cache key for this product's images
  const cacheKey = `product_images_${mainImage}`;
  const cachedImages = sessionStorage.getItem(cacheKey);

  // Return cached results if available
  if (cachedImages) {
    try {
      const parsed = JSON.parse(cachedImages);
      return {
        mainImageUrl: parsed.mainImageUrl,
        validAdditionalImages: parsed.validAdditionalImages
      };
    } catch (e) {
      console.error('Error parsing cached images:', e);
      // Continue with normal processing if cache parsing fails
    }
  }

  // Process additional images
  let validAdditionalImages: string[] = [];

  if (additionalImages && Array.isArray(additionalImages)) {
    // Map each additional image to its URL
    const additionalImageUrls = additionalImages
      .filter(img => img && img.trim() !== '') // Filter out empty strings
      .map(img => {
        // Log the original image path for debugging
        console.log('Processing additional image:', img);

        // Handle paths that might be using the old format (./images/filename.jpg)
        if (img.startsWith('./images/') && !img.includes('/images/')) {
          // Extract the filename
          const parts = img.split('/');
          const filename = parts[parts.length - 1];

          // Try to determine the product folder from the filename
          let productFolder = 'product';

          // For "caj konoplja 1.jpeg" style filenames, extract the product name
          if (filename.includes(' ')) {
            const nameParts = filename.split(' ');
            if (nameParts.length >= 2) {
              // Use the first two parts as the product folder (e.g., "caj konoplja")
              productFolder = `${nameParts[0]} ${nameParts[1]}`.toLowerCase();
            }
          }

          // Create the correct path format
          const correctedPath = `/images/${productFolder}/${filename}`;
          console.log('Corrected path:', correctedPath);
          return getImageUrl(correctedPath);
        }

        // Special handling for "paket 3.jpg" file
        if (img.includes('paket 3.jpg')) {
          console.log('Special handling for paket 3.jpg image path');
          // Ensure we're using the correct format
          const correctedPath = img.startsWith('/') ? img : `/images/paket/${img.split('/').pop()}`;
          return getImageUrl(correctedPath);
        }

        return getImageUrl(img);
      });

    // Filter out duplicates, the main image, and placeholder images
    validAdditionalImages = [...new Set(additionalImageUrls)]
      .filter(url => {
        // Skip empty URLs
        if (url === '' || url === undefined) return false;

        // Skip the main image
        if (url === mainImageUrl) return false;

        // Skip placeholder images
        if (url === DEFAULT_FALLBACK_IMAGE || url.includes('placeholder.svg') || url.includes('placeholder-product')) return false;

        return true;
      });

    // Validate each image in parallel
    const validationPromises = validAdditionalImages.map(async (url) => {
      const isValid = await validateImageUrl(url);
      return { url, isValid };
    });

    // Wait for all validations to complete
    const validationResults = await Promise.all(validationPromises);

    // Log validation results for debugging
    console.log('Image validation results:', validationResults);

    // Keep only valid images
    validAdditionalImages = validationResults
      .filter(result => result.isValid)
      .map(result => result.url);

    console.log('Final valid additional images:', validAdditionalImages);
  }

  // Limit to 6 additional images
  const result = {
    mainImageUrl,
    validAdditionalImages: validAdditionalImages.slice(0, 6)
  };

  // Only cache if we have valid images
  if (result.validAdditionalImages.length > 0) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      console.log('Cached image results for:', cacheKey);
    } catch (e) {
      console.error('Error caching images:', e);
    }
  } else {
    // Clear the cache if we don't have valid images
    try {
      sessionStorage.removeItem(cacheKey);
      console.log('Cleared image cache for:', cacheKey);
    } catch (e) {
      console.error('Error clearing image cache:', e);
    }
  }

  return result;
}

/**
 * Clears all image-related caches from session storage
 * This can be useful when debugging image issues
 */
export function clearAllImageCaches(): void {
  try {
    // Get all keys from session storage
    const keys = Object.keys(sessionStorage);

    // Filter for image-related keys
    const imageCacheKeys = keys.filter(key =>
      key.startsWith('product_images_') ||
      key.startsWith('img_valid_')
    );

    // Remove each image cache key
    imageCacheKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });

    console.log(`Cleared ${imageCacheKeys.length} image cache entries`);
  } catch (e) {
    console.error('Error clearing image caches:', e);
  }
}

/**
 * Generate image path for product based on product name and filename
 * Consolidates the logic used across multiple components
 */
export function generateProductImagePath(productName: string, filename: string): string {
  const productFolder = productName.toLowerCase().trim().replace(/\s+/g, ' ') || 'product';
  return `/images/${productFolder}/${filename}`;
}

/**
 * Extract filename from a file input event
 * Common pattern used in forms
 */
export function extractFilename(event: Event): string | null {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  return file ? file.name : null;
}

/**
 * Check if an image URL is a placeholder
 */
export function isPlaceholderImage(url: string): boolean {
  return url.includes('placeholder') || url.includes('default') || url === DEFAULT_FALLBACK_IMAGE;
}
