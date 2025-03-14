-- Add pin_icon field to trees table
ALTER TABLE trees ADD COLUMN pin_icon VARCHAR(255) AFTER image_url;

-- Update existing trees with default icons based on tree names (examples)
UPDATE trees SET pin_icon = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' WHERE pin_icon IS NULL;

-- You can set specific icons for specific trees, for example:
-- UPDATE trees SET pin_icon = 'custom-icons/palm.png' WHERE name LIKE '%Palm%';
-- UPDATE trees SET pin_icon = 'custom-icons/pine.png' WHERE name LIKE '%Pine%';
-- UPDATE trees SET pin_icon = 'custom-icons/oak.png' WHERE name LIKE '%Oak%'; 