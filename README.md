# Image Inspector Chrome Extension

A Chrome extension that analyzes and displays all images on the current webpage with their format, dimensions, and file size in a clean tabular format.

## Features

- **Scan Current Page**: Instantly scan any webpage for all images
- **Detailed Information**: View image format, dimensions, and file size
- **Image Preview**: See thumbnails of all images
- **Tabular Display**: Clean, sortable table format
- **Fast & Efficient**: Optimized for performance
- **Modern UI**: Beautiful, responsive interface

## Installation

### From Source (Developer Mode)

1. **Clone or download this repository**
   ```bash
   cd "Image Inspector"
   ```

2. **Generate Icons** (if not already present)
   - Open `generate_icons.html` in your browser
   - Right-click each icon and save as:
     - `icons/icon16.png`
     - `icons/icon48.png`
     - `icons/icon128.png`
   - Alternatively, create your own icons with these dimensions

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `Image Inspector` folder
   - The extension should now appear in your extensions list

## Usage

1. Navigate to any webpage you want to analyze
2. Click the Image Inspector extension icon in your Chrome toolbar
3. Click the "Show Image Details" button
4. View all images in a detailed table showing:
   - **Preview**: Thumbnail of the image
   - **Source**: URL of the image
   - **Format**: Image format (JPEG, PNG, WebP, etc.)
   - **Dimensions**: Width × Height in pixels
   - **Size**: File size in bytes/KB/MB

## File Structure

```
Image Inspector/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic and UI handling
├── content.js            # Content script for image extraction
├── styles.css            # Styling for the popup
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── generate_icons.html   # Tool to generate icons
└── README.md            # This file
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `activeTab` (only accesses the current tab when clicked)
- **Browser Compatibility**: Chrome, Edge, and other Chromium-based browsers

## Privacy

This extension:
- Only runs when you click the extension icon
- Only accesses the current active tab
- Does not collect or transmit any data
- Works entirely locally in your browser

## Development

### Making Changes

1. Edit the relevant files (`popup.js`, `content.js`, `styles.css`, etc.)
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Image Inspector extension card
4. Test your changes

### Debugging

- Right-click the extension popup → "Inspect" to debug popup code
- Use Chrome DevTools → Console to debug content script
- Check `chrome://extensions/` for any errors

## Support

For issues or questions, please check the code comments or create an issue in the repository.
