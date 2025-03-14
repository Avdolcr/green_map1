# Green Map Database Fixes

This repository contains scripts and code updates to fix issues with the database schema and JSON handling for the Green Map application.

## Problem Overview

The application was experiencing issues with handling pin locations, styles, and images. The specific problems included:

1. JSON parsing errors when saving tree locations
2. Inability to support multiple pin styles and images for different locations
3. Inconsistencies between the database schema and application code

## Solution

The solution addresses these problems through several key improvements:

1. **Database Schema Updates**: Converting the `location` column to JSON type and ensuring other columns allow NULL values
2. **API Route Improvements**: Enhanced JSON handling for both old and new data formats
3. **Migration Script**: Automatic conversion of old data format to new format
4. **UI Enhancements**: Better feedback and visualization for pin-specific styling

## How to Fix Database Issues

### Step 1: Run the Database Fix Script

We've provided two scripts to fix the database schema and migrate existing data:

#### For Windows:
```
fix_database.bat
```

#### For Linux/macOS:
```
chmod +x fix_database.sh
./fix_database.sh
```

These scripts will:
1. Create a backup of your trees table
2. Modify the location column to JSON type
3. Fix any invalid JSON data
4. Migrate old location format to new format
5. Add map center fields if needed

### Step 2: Migrate Existing Data

After updating the database schema, access the migration tool through the admin dashboard:

1. Go to the Admin Dashboard
2. Click on "Migrate Data" in the navigation menu
3. Confirm the migration action
4. Check the migration results for any errors

## New Features

### Multiple Pin Styles and Images

The updated code now supports:
- Different pin styles (colors/icons) for each location on a tree
- Individual photos for each pin location
- Draggable pins directly on the map with real-time updates

### Better JSON Handling

The API routes now include:
- Robust validation for incoming data
- Smart conversion between different formats
- Graceful error handling for malformed data

### Default Map Settings

The application now supports:
- Default map center and zoom settings
- Centered on La Union, Naguilian, Philippines
- Customizable per tree

## Technical Details

### Database Schema Changes

The `trees` table now has these key columns:
- `location`: JSON type (storing an array of pin objects)
- `pin_icon` and `pin_location_img`: Kept for backward compatibility
- Added `map_center_lat`, `map_center_lng`, and `map_default_zoom`

### Location Data Format

The new JSON structure for the `location` field:

```json
[
  {
    "coord": [16.5324, 120.3929],
    "icon": "https://example.com/pin-icon.png",
    "image": "https://example.com/location-photo.jpg"
  },
  {
    "coord": [16.5368, 120.3872],
    "icon": "https://example.com/another-icon.png",
    "image": "https://example.com/another-photo.jpg"
  }
]
```

### Backward Compatibility

The system maintains backward compatibility through:
- Automatic detection and conversion of old formats
- Preservation of global styles when needed
- Graceful fallbacks when data is missing

## Troubleshooting

If you encounter issues:

1. **Check the database logs** for any errors during schema updates
2. **Run the migration tool again** if some trees weren't properly converted
3. **Check the API logs** for detailed error messages
4. **Use the manual coordinate entry** feature if map interactions aren't working

## Contributing

Feel free to contribute to this project by:
1. Reporting bugs
2. Suggesting improvements
3. Submitting pull requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

admie key is : green-map-admin-key-2023
email api :app.mailgun.com