# Tree Admin - Migration Guide

This guide explains how to implement the updates to support multiple pin styles and images for each location point, as well as configuring the default map center to the Philippines (La Union, Naguilian).

## Overview of Changes

We've made the following improvements:

1. **Multiple Pin Styles & Images**: Each pin on the map can now have its own style (icon) and location image
2. **Database Schema Update**: The database schema has been updated to properly support this new format
3. **Map Centering**: Default map view now centers on La Union, Naguilian, Philippines
4. **Settings System**: Added a global settings system to easily update map defaults

## Step 1: Database Schema Update

Run the `update_schema.sql` script on your MySQL database:

```bash
# Using mysql command line client
mysql -u yourusername -p admin_trees < update_schema.sql

# OR run the SQL commands in phpMyAdmin or your preferred MySQL client
```

This script will:
1. Update the comment on the `location` field to document the new format
2. Create a backup of all tree data in a new table called `trees_backup`
3. Add map center and zoom level fields to the `trees` table
4. Create a new `app_settings` table for global application settings
5. Insert default map settings for La Union, Naguilian

## Step 2: Deploy Code Changes

The changes include:
- Updated map components to use the new location format
- API endpoints to handle the data migration
- Settings API for accessing global configuration

## Step 3: Run the Data Migration

After deploying the code updates, you need to run the data migration:

1. Navigate to http://yourdomain.com/admin/migrate
2. Click the "Start Migration" button
3. Wait for the migration to complete
4. Review the results to ensure all trees were migrated successfully

The migration process:
- Converts old location format (array of coordinate strings) to new format (array of pin objects)
- Preserves existing pin styles and images by applying them to each pin
- Skips trees that have already been migrated
- Provides detailed success/failure information

## Impact on Existing Code

These changes are backward compatible:
- The API endpoints can handle both old and new location formats
- Trees that haven't been migrated will still display correctly
- Pins that don't have specific styles will use the default pin style

## Future Cleanup (Optional)

After all data has been successfully migrated and your application has been running stably with the new format, you may optionally run the following SQL to remove the obsolete columns:

```sql
ALTER TABLE `trees` DROP COLUMN `pin_icon`, DROP COLUMN `pin_location_img`;
```

This is not required and should only be done after thorough testing.

## Troubleshooting

If you experience any issues:

1. **Database Connection Errors**: Verify your database connection settings in `.env`
2. **Map Display Issues**: Check browser console for JavaScript errors
3. **Migration Failures**: Review the detailed migration results and check server logs

## Technical Details

### New Location Format

The location data is now stored as a JSON array of pin objects:

```json
[
  {
    "coord": [16.5324, 120.3929],
    "icon": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    "image": "/uploads/some-location-image.jpg"
  },
  {
    "coord": [16.5368, 120.3872],
    "icon": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    "image": null
  }
]
```

### Map Settings

The default map center is set to La Union, Naguilian, Philippines:
- Latitude: 16.5324
- Longitude: 120.3929
- Default zoom level: 13

These settings can be updated through the admin interface or by directly editing the `app_settings` table. 