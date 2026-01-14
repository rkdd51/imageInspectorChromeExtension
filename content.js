// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImageDetails') {
    getImageDetails().then(sendResponse);
    return true; // Indicates we will send a response asynchronously
  }
});

async function getImageDetails() {
  const images = [];
  const imageElements = document.querySelectorAll('img');
  const processedUrls = new Set(); // Avoid duplicates

  for (const img of imageElements) {
    try {
      const src = img.src || img.currentSrc || img.getAttribute('src');
      
      if (!src || processedUrls.has(src)) {
        continue;
      }

      processedUrls.add(src);

      // Get image dimensions
      let width = img.naturalWidth || img.width || 0;
      let height = img.naturalHeight || img.height || 0;

      // If dimensions are not available, try to load the image
      if (width === 0 || height === 0) {
        try {
          const imgData = await loadImageData(src);
          width = imgData.width;
          height = imgData.height;
        } catch (e) {
          console.warn('Could not load image dimensions:', src);
        }
      }

      // Get image format from URL extension or MIME type
      let format = 'Unknown';
      try {
        const url = new URL(src);
        const pathname = url.pathname.toLowerCase();
        const extension = pathname.substring(pathname.lastIndexOf('.') + 1);
        
        // Common image formats
        const formatMap = {
          'jpg': 'JPEG',
          'jpeg': 'JPEG',
          'png': 'PNG',
          'gif': 'GIF',
          'webp': 'WebP',
          'svg': 'SVG',
          'bmp': 'BMP',
          'ico': 'ICO',
          'avif': 'AVIF',
          'heic': 'HEIC',
          'heif': 'HEIF'
        };
        
        format = formatMap[extension] || extension.toUpperCase() || 'Unknown';
        
        // Try to get MIME type from response headers if available
        if (format === 'Unknown' || format === extension.toUpperCase()) {
          try {
            const response = await fetch(src, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
              const mimeFormat = contentType.split('/')[1].toUpperCase();
              format = mimeFormat === 'JPEG' ? 'JPEG' : mimeFormat;
            }
          } catch (e) {
            // If HEAD request fails, use extension-based format
          }
        }
      } catch (e) {
        console.warn('Could not determine format for:', src);
      }

      // Get file size
      let size = 0;
      try {
        // Handle data URLs
        if (src.startsWith('data:')) {
          const base64Data = src.split(',')[1];
          if (base64Data) {
            // Estimate size for data URLs (base64 encoded)
            size = Math.floor(base64Data.length * 0.75); // Approximate decoded size
          }
        }
        // Handle blob URLs (size unavailable without loading)
        else if (src.startsWith('blob:')) {
          // Blob size unavailable without loading the blob
          size = 0;
        }
        // Try to fetch size for regular URLs
        else {
          try {
            const response = await fetch(src, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              size = parseInt(contentLength, 10);
            } else {
              // Try full fetch if HEAD doesn't provide size (may fail due to CORS)
              try {
                const fullResponse = await fetch(src);
                const blob = await fullResponse.blob();
                size = blob.size;
              } catch (e) {
                // Size unavailable due to CORS or other issues
              }
            }
          } catch (e) {
            // HEAD request failed (likely CORS), size unavailable
          }
        }
      } catch (e) {
        // Size unavailable
      }

      // Convert image to data URL for preview (to avoid CORS issues in popup)
      // Use the existing img element which is already loaded in the page context
      let previewDataUrl = null;
      let actualSize = size; // Will be updated if we can get it from the blob
      
      try {
        const previewResult = await getImagePreviewDataUrl(img, src);
        // previewResult.dataUrl might be null if canvas conversion failed (tainted canvas)
        previewDataUrl = previewResult.dataUrl || null;
        // If we got size from the blob during preview creation, use it
        if (previewResult.size && previewResult.size > 0) {
          actualSize = previewResult.size;
        }
      } catch (e) {
        // Silently handle preview failures - we'll show original src or placeholder
        // Don't log as error since this is expected for cross-origin images without CORS
        if (!e.message.includes('tainted') && !e.message.includes('Tainted')) {
          console.warn('Could not create preview for:', src, e.message);
        }
        // If preview fails, previewDataUrl stays null and popup will handle fallback
      }

      // If size is still 0, estimate it based on image dimensions and format
      // This is approximate but better than showing "Unknown"
      if (actualSize === 0 && width > 0 && height > 0) {
        actualSize = estimateImageSize(width, height, format);
      }

      images.push({
        src: src,
        previewDataUrl: previewDataUrl, // Data URL for preview
        width: width,
        height: height,
        format: format,
        size: actualSize
      });
    } catch (error) {
      console.warn('Error processing image:', error);
    }
  }

  // Sort by size (largest first) or by dimensions
  images.sort((a, b) => {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    return areaB - areaA;
  });

  return { 
    images: images,
    pageUrl: window.location.href
  };
}

function loadImageData(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    let timeoutId;
    let resolved = false;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
    
    img.onload = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error('Failed to load image'));
    };
    
    // Timeout after 5 seconds
    timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error('Image load timeout'));
    }, 5000);
    
    img.src = src;
  });
}

async function getImagePreviewDataUrl(imgElement, src) {
  // If already a data URL, return as is (but resize if too large)
  if (src.startsWith('data:')) {
    // If it's a data URL, try to resize it if needed
    try {
      const blob = await dataURLToBlob(src);
      const dataUrl = await blobToDataURL(blob, 100);
      return { dataUrl, size: blob.size };
    } catch (e) {
      // Estimate size from data URL
      const base64Data = src.split(',')[1];
      const estimatedSize = base64Data ? Math.floor(base64Data.length * 0.75) : 0;
      return { dataUrl: src, size: estimatedSize };
    }
  }

  // Check if it's an SVG (can't be drawn to canvas easily)
  const isSVG = src.toLowerCase().includes('.svg') || 
                src.toLowerCase().includes('image/svg');

  // If blob URL, try to get blob and convert
  if (src.startsWith('blob:')) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      // For SVG blobs, return as data URL without canvas conversion
      if (isSVG || blob.type.includes('svg')) {
        const dataUrl = await blobToDataURL(blob);
        return { dataUrl, size: blob.size };
      }
      const dataUrl = await blobToDataURL(blob, 100);
      return { dataUrl, size: blob.size };
    } catch (e) {
      throw new Error('Could not convert blob to data URL');
    }
  }

  // For SVG images, try to fetch and convert to data URL directly
  if (isSVG) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const dataUrl = await blobToDataURL(blob);
      return { dataUrl, size: blob.size };
    } catch (e) {
      // If fetch fails, try using the image element directly
      try {
        const img = imgElement.complete ? imgElement : await loadImageForPreview(src);
        const dataUrl = await convertImageToDataURL(img, 100);
        return { dataUrl, size: 0 }; // Size unavailable for SVG from canvas
      } catch (e2) {
        throw new Error('Could not create SVG preview');
      }
    }
  }

  // For regular images, try to fetch first to get size, then create preview
  try {
    // Try fetching the image to get actual size and create preview
    let blobSize = 0;
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      blobSize = blob.size;
      // If we got the blob, use it for preview (this avoids tainted canvas issues)
      const dataUrl = await blobToDataURL(blob, 100);
      return { dataUrl, size: blobSize };
    } catch (fetchError) {
      // Fetch failed (CORS), try canvas method as fallback
      // Prefer using the existing image element from the page
      let img = imgElement;
      
      // Only create a new image if the existing one isn't loaded
      if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
        // Wait a bit for the image to load if it's in progress
        if (img.complete === false) {
          await new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              const timeout = setTimeout(resolve, 1000); // Wait max 1 second
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve();
              };
            }
          });
        }
        
        // If still not loaded, try creating a new one
        if (!img.complete || img.naturalWidth === 0) {
          img = await loadImageForPreview(src);
        }
      }

      // Try to convert using canvas (may fail with tainted canvas error)
      try {
        const dataUrl = await convertImageToDataURL(img, 100);
        return { dataUrl, size: blobSize }; // Size will be 0, will use estimate
      } catch (canvasError) {
        // Canvas conversion failed (tainted canvas or other error)
        // Return null for preview - popup will use original src or placeholder
        // Don't throw error, just return null so we can still show other image info
        console.warn('Canvas conversion failed (tainted canvas):', src);
        return { dataUrl: null, size: blobSize };
      }
    }
  } catch (e) {
    // If all methods fail, return null for preview but don't throw
    // This allows the extension to still show image info even if preview fails
    console.warn('Could not create preview:', src, e.message);
    return { dataUrl: null, size: 0 };
  }
}

function loadImageForPreview(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Don't set crossOrigin here - let the browser handle it naturally
    // Setting crossOrigin='anonymous' requires CORS headers which may not be present
    
    let timeoutId;
    let resolved = false;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
    
    img.onload = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(img);
    };
    
    img.onerror = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error('Failed to load image'));
    };
    
    timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error('Image load timeout'));
    }, 5000);
    
    img.src = src;
  });
}

async function convertImageToDataURL(img, maxSize) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    
    if (width === 0 || height === 0) {
      throw new Error('Invalid image dimensions');
    }

    // Calculate scaled dimensions maintaining aspect ratio
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);

    canvas.width = width;
    canvas.height = height;

    // Draw image to canvas
    // This may fail if image is cross-origin without CORS headers (tainted canvas)
    try {
      ctx.drawImage(img, 0, 0, width, height);
    } catch (drawError) {
      throw new Error('Cannot draw image to canvas (CORS/tainted)');
    }

    // Convert to data URL - this will throw if canvas is tainted
    let dataURL;
    try {
      dataURL = canvas.toDataURL('image/png', 0.8);
    } catch (toDataURLError) {
      // Specifically catch tainted canvas error
      if (toDataURLError.message && toDataURLError.message.includes('tainted')) {
        throw new Error('Tainted canvas - cannot export');
      }
      throw toDataURLError;
    }
    
    // Check if conversion was successful (tainted canvas might return empty string)
    if (!dataURL || dataURL.length < 100 || dataURL === 'data:,') {
      throw new Error('Canvas conversion failed (possibly tainted)');
    }
    
    return dataURL;
  } catch (e) {
    // Re-throw with more context
    if (e.message.includes('tainted') || e.message.includes('Tainted')) {
      throw new Error('Tainted canvas - cannot export');
    }
    throw e;
  }
}

function dataURLToBlob(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(resolve, 'image/png', 0.8);
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}

function estimateImageSize(width, height, format) {
  // Estimate file size based on dimensions and format
  // These are rough estimates and may not be accurate
  if (!width || !height || width <= 0 || height <= 0) {
    return 0;
  }
  
  const pixels = width * height;
  
  // Compression ratios vary by format
  const compressionRatios = {
    'JPEG': 0.1,      // ~10% of uncompressed size (high compression)
    'PNG': 0.3,       // ~30% of uncompressed size (lossless, varies)
    'GIF': 0.15,      // ~15% of uncompressed size
    'WebP': 0.08,     // ~8% of uncompressed size (very efficient)
    'SVG': 0.001,     // Vector, very small
    'BMP': 1.0,       // Uncompressed
    'AVIF': 0.06,     // ~6% (very efficient)
    'Unknown': 0.2    // Default estimate
  };
  
  // Assume 4 bytes per pixel (RGBA) for uncompressed
  const uncompressedSize = pixels * 4;
  const ratio = compressionRatios[format] || compressionRatios['Unknown'];
  
  const estimated = Math.floor(uncompressedSize * ratio);
  // Ensure we return at least 1 byte for valid images
  return Math.max(1, estimated);
}

function blobToDataURL(blob, maxSize = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      
      // If maxSize is specified, resize the image
      if (maxSize) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.8));
        };
        img.onerror = () => resolve(dataUrl); // Return original if resize fails
        img.src = dataUrl;
      } else {
        resolve(dataUrl);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
