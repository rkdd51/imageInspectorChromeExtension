document.addEventListener('DOMContentLoaded', () => {
  const showDetailsBtn = document.getElementById('showDetailsBtn');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const results = document.getElementById('results');
  const noImages = document.getElementById('noImages');
  const imageTableBody = document.getElementById('imageTableBody');
  const imageCount = document.getElementById('imageCount');

  showDetailsBtn.addEventListener('click', async () => {
    try {
      // Hide previous results
      results.classList.add('hidden');
      noImages.classList.add('hidden');
      error.classList.add('hidden');
      
      // Show loading state
      loading.classList.remove('hidden');
      showDetailsBtn.disabled = true;

      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        throw new Error('Unable to access current tab');
      }

      // Check if we can inject scripts (some pages like chrome:// are restricted)
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) {
        throw new Error('Cannot analyze images on this page type. Please navigate to a regular webpage.');
      }

      // Inject content script dynamically to ensure it's available
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (injectError) {
        // If injection fails, the content script might already be injected
        // or the page might not allow script injection
        // Silently continue - will try messaging anyway
      }

      // Wait a brief moment for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get image details from content script
      let imageDetails;
      try {
        imageDetails = await chrome.tabs.sendMessage(tab.id, { action: 'getImageDetails' });
      } catch (messageError) {
        // If message fails, try injecting and messaging again
        if (messageError.message.includes('Receiving end does not exist')) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(resolve => setTimeout(resolve, 200));
          imageDetails = await chrome.tabs.sendMessage(tab.id, { action: 'getImageDetails' });
        } else {
          throw messageError;
        }
      }

      // Hide loading state
      loading.classList.add('hidden');
      showDetailsBtn.disabled = false;

      if (!imageDetails || !imageDetails.images || imageDetails.images.length === 0) {
        noImages.classList.remove('hidden');
        return;
      }

      // Display results
      displayResults(imageDetails.images);
      results.classList.remove('hidden');
      
    } catch (err) {
      console.error('Error:', err);
      loading.classList.add('hidden');
      showDetailsBtn.disabled = false;
      error.textContent = `Error: ${err.message || 'Failed to get image details'}`;
      error.classList.remove('hidden');
    }
  });

  function displayResults(images) {
    imageCount.textContent = images.length;
    imageTableBody.innerHTML = '';

    const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\'%3E%3Crect fill=\'%23ddd\' width=\'50\' height=\'50\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'0.3em\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E';

    images.forEach((img, index) => {
      const row = document.createElement('tr');
      
      // Format file size
      const sizeText = img.size ? formatBytes(img.size) : 'Unknown';
      
      // Format dimensions
      const dimensionsText = img.width && img.height 
        ? `${img.width} × ${img.height}px` 
        : 'Unknown';
      
      // Get format from URL or MIME type
      const format = img.format || 'Unknown';
      
      // Truncate long URLs
      const displayUrl = img.src.length > 50 
        ? img.src.substring(0, 47) + '...' 
        : img.src;

      // Use previewDataUrl if available, otherwise fallback to src
      const previewSrc = img.previewDataUrl || img.src;

      // Create table cells
      const indexCell = document.createElement('td');
      indexCell.className = 'index';
      indexCell.textContent = index + 1;

      const previewCell = document.createElement('td');
      previewCell.className = 'preview';
      const previewImg = document.createElement('img');
      previewImg.src = previewSrc;
      previewImg.alt = 'Preview';
      previewImg.loading = 'lazy';
      // Add error handler programmatically (CSP compliant)
      previewImg.addEventListener('error', function() {
        this.src = fallbackImage;
      });
      previewCell.appendChild(previewImg);

      const sourceCell = document.createElement('td');
      sourceCell.className = 'source';
      sourceCell.title = img.src;
      const sourceLink = document.createElement('a');
      sourceLink.href = img.src;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      sourceLink.textContent = displayUrl;
      sourceCell.appendChild(sourceLink);

      const formatCell = document.createElement('td');
      formatCell.className = 'format';
      formatCell.textContent = format;

      const dimensionsCell = document.createElement('td');
      dimensionsCell.className = 'dimensions';
      dimensionsCell.textContent = dimensionsText;

      const sizeCell = document.createElement('td');
      sizeCell.className = 'size';
      sizeCell.textContent = sizeText;

      // Append all cells to row
      row.appendChild(indexCell);
      row.appendChild(previewCell);
      row.appendChild(sourceCell);
      row.appendChild(formatCell);
      row.appendChild(dimensionsCell);
      row.appendChild(sizeCell);
      
      imageTableBody.appendChild(row);
    });
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
});
