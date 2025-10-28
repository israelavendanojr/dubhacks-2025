# dubhacks-2025

# KELP - Environmental Risk Terrain Visualizer
AUTHORS: JEFFREY,ISRAEL,PRANAV,ZURIAHN

**DubHacks 2025 Project** 

A cutting-edge 3D geospatial visualization platform that transforms environmental risk data into dramatic mountain landscapes. Built for the University of Washington's DubHacks 2025 hackathon, this project combines AI-powered data generation with immersive 3D terrain visualization to help users understand environmental risks across King County, Seattle.

## Project Overview

Risk3D features a two-stage AI pipeline that generates realistic environmental data and renders it as stunning 3D terrain using WebGL. Users can explore risk factors like air quality, noise pollution, and flood risk through an interactive 3D landscape where higher peaks represent greater risk areas.

### Key Features

- **AI-Powered Data Generation**: Two-stage LLM pipeline using Google Gemini
- **3D Terrain Visualization**: Risk data rendered as dramatic mountain peaks
- **Interactive Controls**: Real-time adjustment of risk factor weights
- **Smart Insights**: AI-generated explanations for risk patterns
- **Immersive UI**: Dark theme with professional design
- **Responsive Design**: Works across desktop and mobile devices

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Pipeline   │
│   (React/TS)    │◄──►│   (FastAPI)     │◄──►│  (Google Gemini)│
│                 │    │                 │    │                 │
│ • 3D Terrain    │    │ • Data Engine   │    │ • Director      │
│ • Risk Controls │    │ • API Endpoints │    │ • Engineer      │
│ • Info Panel    │    │ • CORS Support  │    │ • Normalization │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dubhacks-2025
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
echo "GOOGLE_API_KEY=your_actual_api_key_here" > .env

# Start the backend server
uvicorn main:app --reload
```

The backend will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs

### 3. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:5173

## How to Use

### 1. Generate Risk Data
- Enter a scenario prompt in the bottom prompt bar (e.g., "Simulate air quality during a heat wave in Seattle")
- Click "Generate Terrain" to create 3D risk visualization
- Watch as the AI generates realistic environmental data

### 2. Explore 3D Terrain
- **Pan**: Click and drag to move around
- **Zoom**: Use mouse wheel or pinch gestures
- **Rotate**: Right-click and drag to rotate view
- **Hover**: Hover over terrain peaks to see detailed risk information

### 3. Interactive Features
- **Info Panel**: Left sidebar shows detailed risk breakdowns
- **County Insights**: AI-generated explanations for risk patterns
- **Real-time Updates**: Terrain updates as you adjust parameters

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Deck.gl** for 3D WebGL visualization
- **React Map GL** for base mapping
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Vite** for build tooling

### Backend
- **FastAPI** for REST API
- **Google Gemini 2.5 Pro** for AI data generation
- **Pydantic** for data validation
- **Uvicorn** for ASGI server

### AI Pipeline
- **Director**: Converts user prompts to technical specifications
- **Engineer**: Generates geo-spatial data with normalization
- **Two-stage processing** for accurate, realistic data

## Project Structure

```
dubhacks-2025/
├── Backend/                    # FastAPI backend
│   ├── main.py                # API endpoints and server setup
│   ├── data_engineers.py      # AI pipeline implementation
│   ├── requirements.txt       # Python dependencies
│   ├── unique_lat_lon.csv     # Geographic coordinate data
│   └── README.md              # Backend documentation
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Map/          # 3D terrain visualization
│   │   │   ├── InfoPanel.tsx # Risk information display
│   │   │   └── PromptBar.tsx # AI prompt interface
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   └── types/            # TypeScript definitions
│   ├── package.json          # Node.js dependencies
│   └── README.md             # Frontend documentation
└── README.md                  # This file
```

## 🎯 Demo Scenarios

Try these example prompts to see Risk3D in action:

1. **Heat Wave Impact**: "Simulate air quality in Seattle during a heat wave in July 2024"
2. **Industrial Pollution**: "Show NO2 levels near industrial areas in King County"
3. **Traffic Patterns**: "Visualize noise pollution along major highways"
4. **Climate Risk**: "Display flood risk in low-lying areas near Puget Sound"
5. **Seasonal Changes**: "Compare winter vs summer air quality patterns"

## 🔧 Development

### Running in Development Mode

1. **Backend**: `uvicorn main:app --reload` (auto-reloads on changes)
2. **Frontend**: `npm run dev` (hot module replacement)

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd Backend
# Deploy with your preferred method (Docker, cloud platform, etc.)
```

### Environment Variables

Create a `.env` file in the `Backend/` directory:

```bash
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

## Visual Design

### Color Scale
- ** Green (0-15%)**: Safe areas (valleys)
- ** Yellow (15-35%)**: Low risk
- ** Orange (35-50%)**: Moderate risk
- ** Red (50-85%)**: High risk
- ** Purple (85-100%)**: Extreme risk (peaks)

### 3D Effects
- **Dynamic Height**: Risk scores × 3000 for dramatic visibility
- **Realistic Lighting**: Ambient + directional lighting
- **Smooth Animations**: Framer Motion transitions
- **Interactive Tooltips**: Hover effects with detailed data

## Future Enhancements

- **Real-time Data**: Integration with live environmental APIs
- **Time-lapse**: Historical risk data visualization
- **Export Features**: Screenshot and data export capabilities
- **Mobile App**: Native mobile application
- **VR Support**: Virtual reality exploration mode
- **Machine Learning**: Predictive risk modeling

## Contributing

This project was built for DubHacks 2025. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Built for **DubHacks 2025** - University of Washington Hackathon

## Team

Created by the Risk3D team for DubHacks 2025, showcasing the intersection of AI, 3D visualization, and environmental data science.

---

**Risk3D** - Where environmental data becomes dramatic 3D landscapes! 

*Transform the way we understand and visualize environmental risks through immersive 3D terrain visualization.*
