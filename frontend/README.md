# Risk3D - 3D Geospatial Risk Terrain Visualizer

A dramatic 3D visualization tool that renders risk data as mountain peaks across King County, Seattle. Built for DubHacks 2025.

## 🏔️ Features

- **3D Terrain Visualization**: Risk data rendered as dramatic mountain peaks using Deck.gl
- **Interactive Risk Controls**: Adjust air quality, noise pollution, and flood/climate risk weights
- **Real-time Terrain Generation**: Dynamic 3D landscape updates based on risk factor weights
- **Camera Animations**: Fly-through tours and focus on highest risk areas
- **Interactive Tooltips**: Hover over terrain to see detailed risk breakdowns
- **Professional UI**: Dark theme with cyan accents matching the reference design

## 🛠️ Tech Stack

- **Frontend**: Vite + React + TypeScript
- **3D Visualization**: Deck.gl with ColumnLayer
- **Base Map**: React Map GL with Mapbox Dark theme
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Custom React hooks

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:5173`

## 🎮 How to Use

### Risk Control Panel (Left Sidebar)
- **Air Quality Slider**: Adjust weight for air pollution risk (default: 40%)
- **Noise Pollution Slider**: Adjust weight for noise risk (default: 35%)
- **Flood/Climate Slider**: Adjust weight for flood risk (default: 25%)
- **Generate Button**: Click to regenerate 3D terrain with new weights

### Demo Controls (Top Right)
- **Focus on Highest Risk**: Camera flies to the tallest risk peak
- **Fly-Through Tour**: Automated tour of key areas in King County
- **Reset View**: Return to default Seattle view

### Interactive Features
- **Hover Tooltips**: Hover over any terrain column to see risk breakdown
- **Camera Controls**: Pan, zoom, and rotate the 3D view
- **Real-time Updates**: Terrain automatically updates when sliders change

## 🗺️ Data Coverage

- **Geographic Area**: King County, Washington
- **Grid Resolution**: 100x100 cells (10,000 data points)
- **Risk Factors**:
  - Air Quality: Higher near I-5, I-405, industrial areas
  - Noise Pollution: Higher near highways, SeaTac Airport, downtown
  - Flood/Climate: Higher near Puget Sound, rivers, low-lying areas

## 🎨 Visual Design

### Color Scale
- **0-15%**: Deep green valleys (safe areas)
- **15-35%**: Light green (low risk)
- **35-50%**: Yellow (moderate risk)
- **50-65%**: Orange (high risk)
- **65-85%**: Red-orange (very high risk)
- **85-100%**: Deep red peaks (extreme risk)

### 3D Rendering
- **Column Height**: Risk score × 3000 (for dramatic visibility)
- **Lighting**: Ambient + directional lighting for realistic shadows
- **Material**: Specular highlights and ambient occlusion

## 📁 Project Structure

```
src/
├── components/
│   ├── Map/
│   │   └── RiskTerrainMap.tsx      # Main 3D terrain component
│   └── UI/
│       ├── RiskControlPanel.tsx    # Left sidebar with sliders
│       ├── RiskSlider.tsx          # Individual slider component
│       ├── GenerateButton.tsx      # Cyan generate button
│       ├── Legend.tsx              # Color scale legend
│       └── DemoControls.tsx        # Camera animation controls
├── hooks/
│   ├── useRiskTerrain.ts           # Terrain data generation
│   ├── useRiskWeights.ts           # Slider state management
│   └── useCameraAnimation.ts       # Camera animation system
├── utils/
│   ├── terrainGenerator.ts         # Risk data generation
│   └── colorMapping.ts             # Risk score → color conversion
├── types/
│   └── terrain.types.ts            # TypeScript definitions
└── App.tsx                         # Main application component
```

## 🔧 Development

### Key Components

1. **RiskTerrainMap**: Renders 3D terrain using Deck.gl ColumnLayer
2. **RiskControlPanel**: Manages risk factor weights with vertical sliders
3. **TerrainGenerator**: Creates synthetic risk data for King County
4. **ColorMapping**: Converts risk scores to dramatic color gradients

### Customization

- **Risk Factors**: Add new risk types in `terrainGenerator.ts`
- **Color Scheme**: Modify color stops in `colorMapping.ts`
- **Geographic Area**: Update bounds in `terrainGenerator.ts`
- **3D Effects**: Adjust lighting and materials in `RiskTerrainMap.tsx`

## 🎯 Demo Scenarios

1. **Air Quality Focus**: Set air quality to 80%, others to 10% each
2. **Noise Pollution**: Set noise to 80%, others to 10% each
3. **Flood Risk**: Set flood to 80%, others to 10% each
4. **Balanced Risk**: Use default weights (40%, 35%, 25%)

## 🚀 Future Enhancements

- Real-time data integration with environmental APIs
- Time-lapse visualization showing risk changes over time
- Export functionality for screenshots and data
- Comparison mode for different scenarios
- Mobile-responsive design
- WebGL performance optimizations

## 📄 License

Built for DubHacks 2025 - University of Washington Hackathon

---

**Risk3D** - Where data becomes dramatic 3D landscapes! 🏔️