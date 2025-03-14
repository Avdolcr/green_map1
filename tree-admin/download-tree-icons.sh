#!/bin/bash

# Create the tree-icons directory if it doesn't exist
mkdir -p public/tree-icons

# Sample URLs for tree icons (these are placeholders, you'd replace with actual icon URLs)
# For a real implementation, you would need to use actual tree icons with proper licensing

# Download the icons
echo "Downloading tree icons..."

# Palm tree icon
curl -o public/tree-icons/palm.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"

# Pine tree icon
curl -o public/tree-icons/pine.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"

# Oak tree icon
curl -o public/tree-icons/oak.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png"

# Fruit tree icon
curl -o public/tree-icons/fruit.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"

# Flowering tree icon
curl -o public/tree-icons/flower.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png"

echo "Done downloading tree icons. The icons are just placeholder colored markers for now."
echo "You should replace them with actual tree-specific icons for production use." 