# Mapbox Setup Instructions

## Getting Your Mapbox Access Token

1. **Create a Mapbox Account**:
   - Go to [https://account.mapbox.com/](https://account.mapbox.com/)
   - Sign up for a free account (no credit card required)

2. **Get Your Access Token**:
   - Once logged in, go to your [Account page](https://account.mapbox.com/account/)
   - Scroll down to "Access tokens" section
   - Copy your **Default public token** (starts with `pk.`)

3. **Add Token to Your Project**:
   - Open the `.env` file in the frontend directory
   - Replace the placeholder token with your actual token:
   ```
   VITE_MAPBOX_TOKEN=pk.eyJ1...your_actual_token_here
   ```

4. **Restart Development Server**:
   - Stop your current dev server (Ctrl+C)
   - Run `npm run dev` again
   - The map should now load with the King County base layer

## Map Styles Available

The implementation uses `mapbox://styles/mapbox/dark-v11` by default. You can change this in `RiskTerrainMap.tsx` to any of these styles:

- `mapbox://styles/mapbox/dark-v11` - Dark theme (current)
- `mapbox://styles/mapbox/light-v11` - Light theme
- `mapbox://styles/mapbox/streets-v12` - Standard street map
- `mapbox://styles/mapbox/satellite-v9` - Satellite imagery
- `mapbox://styles/mapbox/outdoors-v12` - Topographic style

## Features Added

✅ **King County Geographic Base Map**: Real Mapbox tiles showing King County
✅ **Camera Presets**: Quick buttons to view Seattle, Bellevue, or full county
✅ **Water Bodies**: Lake Washington and Puget Sound visualization
✅ **Landmarks**: Major cities and locations labeled
✅ **3D Terrain**: Your existing risk terrain data on top of the map
✅ **Pollution Data**: CO pollution visualization overlaid on the map

## Troubleshooting

**Map doesn't appear**:
- Check that your `.env` file has the correct token
- Restart the dev server after adding the token
- Check browser console for Mapbox errors

**3D data doesn't show**:
- Make sure you're zoomed in enough (zoom level 9.5+)
- Check that pitch is > 0 (need 3D view to see height)
- Verify your terrain data is loading correctly

**Performance issues**:
- The map includes performance optimizations (antialias, reuseMaps)
- If still slow, try reducing the number of terrain points or pollution data points
