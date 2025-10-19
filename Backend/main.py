from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
# NOTE: FIX APPLIED HERE - Assuming the core logic file is simply 'data_engineers.py'
from data_engineers import DirectorofDataEngineering, GeminiDataEngineer 
from google.genai import types
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Environmental Data Simulation API",
    description="A two-stage LLM pipeline for generating geo-spatial environmental data",
    version="1.0.0"
)

# Add CORS middleware (Allows your frontend to connect from a different domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for quick hackathon setup
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
# NOTE: Ensure this file exists in the same directory as the script
SIMULATION_FILEPATH = "unique_lat_lon.csv" 

# Initialize Director and Engineer instances
try:
    director = DirectorofDataEngineering(SIMULATION_FILEPATH)
    engineer = GeminiDataEngineer()
except Exception as e:
    # If initialization fails (e.g., missing API key), the service starts but routes will fail
    print(f"FATAL: Failed to initialize Gemini clients. Check API key: {e}")
    director = None
    engineer = None

class ScenarioPrompt(BaseModel):
    """Input model for the POST request."""
    prompt: str

@app.get("/")
async def root():
    return {"message": "Environmental Data Simulation API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "data-simulation-api"}

@app.post("/api/simulate")
async def simulate_scenario(scenario: ScenarioPrompt):
    """
    Generate simulated environmental data based on a scenario prompt.
    
    This endpoint uses a two-stage LLM pipeline:
    1. Director converts the user prompt into a technical specification.
    2. Engineer generates and post-processes the geo-spatial data.
    """
    if director is None or engineer is None:
        raise HTTPException(
            status_code=503,
            detail="Service not ready. Backend components failed to initialize."
        )
    
    if not scenario.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
        
    try:
        # Stage 1: Call Director to get the technical specification
        director_prompt = director.directions(scenario.prompt)
        
        # Stage 2: Call Engineer to generate and post-process the data
        # Uses the director's method to correctly pass the CSV path
        simulated_data = engineer.simulate(director_prompt, director.pass_dummy_csv())
        
        return {
            "success": True,
            "data": simulated_data,
            "director_prompt": director_prompt
        }
        
    except types.APIError as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"API Error during generation: {str(e)}"
        )
    except Exception as e:
        print(f"Internal Processing Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    # This is how you run the application
    uvicorn.run(app, host="0.0.0.0", port=8000)
