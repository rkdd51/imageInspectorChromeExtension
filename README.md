# Image Inspector

A Chrome extension that helps you quickly analyze all images on any webpage. Perfect for developers, designers, and anyone who wants to understand what images are being loaded on a page.

## What It Does

Ever wondered how many images are on a webpage, or how large they are? Image Inspector scans the current page and shows you everything in a clean, organized table. You'll see thumbnails, dimensions, file sizes, formats, and more—all at a glance.

## Features

- 🔍 **Quick Scan**: Analyze any webpage with one click
- 📊 **Detailed Table**: View all images with previews, URLs, formats, dimensions, and file sizes
- 🌐 **Page URL Display**: See the current page URL at the top of the results
- 📋 **Copy to Clipboard**: Export all image data in tabular format with a single click—perfect for pasting into spreadsheets
- 🎨 **Clean Interface**: Modern, easy-to-use design
- ⚡ **Fast Performance**: Optimized to handle pages with many images
- 🔒 **Privacy-First**: Works entirely locally—no data collection, no external requests

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) and search for "Image Inspector"
2. Click "Add to Chrome"
3. Confirm the installation when prompted
4. The extension icon will appear in your Chrome toolbar

### For Developers

If you want to install from source or contribute to the project:

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked"
5. Select the project folder

## How to Use

1. Navigate to any webpage you want to analyze
2. Click the Image Inspector icon in your Chrome toolbar
3. Click "Show Image Details"
4. Browse the results table showing:
   - **Preview**: Thumbnail of each image
   - **Source**: Full URL of the image
   - **Format**: Image type (JPEG, PNG, WebP, SVG, etc.)
   - **Dimensions**: Width × Height in pixels
   - **Size**: File size (automatically formatted as Bytes/KB/MB)

### Copying Data

Need to analyze the data elsewhere? Click the "Copy Table" button to copy all image information in tab-separated format. You can paste it directly into Excel, Google Sheets, or any spreadsheet application.

## Use Cases

- **Web Development**: Quickly identify large images that might be slowing down a page
- **Design Audits**: See what image formats are being used across a site
- **Performance Analysis**: Find oversized images that need optimization
- **Content Review**: Get an overview of all visual content on a page
- **Debugging**: Troubleshoot image loading issues

## Privacy & Security

This extension respects your privacy:
- Only runs when you explicitly click the extension icon
- Only accesses the current active tab
- All processing happens locally in your browser
- No data is collected, stored, or transmitted anywhere
- No external network requests (except for fetching image metadata)

## Browser Compatibility

Works with Chrome, Edge, and other Chromium-based browsers that support Manifest V3.

## Technical Notes

Built with vanilla JavaScript (no frameworks required). Uses Chrome's Manifest V3 API and works entirely client-side. The extension intelligently handles various image sources including regular URLs, data URLs, blob URLs, and SVG images.

## Contributing

Found a bug or have a feature idea? Feel free to open an issue or submit a pull request!

## License

This project is open source and available for personal and commercial use.

---

Made with ❤️ for developers and designers who care about web performance and image optimization.
