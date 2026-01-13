#!/bin/bash
# Script to package the extension for Chrome Web Store submission

echo "📦 Packaging Image Inspector Extension for Chrome Web Store..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Remove old ZIP if exists
if [ -f "ImageInspector.zip" ]; then
    echo "🗑️  Removing old ImageInspector.zip..."
    rm ImageInspector.zip
fi

# Create ZIP file excluding unnecessary files
echo "📦 Creating ZIP file..."
zip -r ImageInspector.zip . \
    -x "*.git*" \
    -x "*.DS_Store" \
    -x "*.swp" \
    -x "*.swo" \
    -x "*~" \
    -x "README.md" \
    -x "QUICKSTART.md" \
    -x "PUBLISHING_GUIDE.md" \
    -x "PRIVACY_POLICY.md" \
    -x "STORE_LISTING.md" \
    -x "package-extension.sh" \
    -x ".gitignore" \
    -x "node_modules/*" \
    -x "*.log" \
    -x "*.tmp" \
    -x "*.temp"

# Check if ZIP was created successfully
if [ -f "ImageInspector.zip" ]; then
    echo ""
    echo "✅ Success! ImageInspector.zip created successfully!"
    echo ""
    echo "📊 ZIP file size: $(du -h ImageInspector.zip | cut -f1)"
    echo ""
    echo "📋 Contents included:"
    unzip -l ImageInspector.zip | grep -E "\.(js|html|css|json|png)$" | head -20
    echo ""
    echo "🚀 Ready to upload to Chrome Web Store!"
    echo "   Go to: https://chrome.google.com/webstore/devconsole"
else
    echo "❌ Error: Failed to create ZIP file"
    exit 1
fi
