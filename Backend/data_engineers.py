from google import genai
from google.genai import types
import pandas as pd
import json
import os
from dotenv import load_dotenv

# Ensure environment variables are loaded for the client initialization
load_dotenv()

class DirectorofDataEngineering:
    """
    Converts a natural language user prompt into a structured, technical 
    specification for the data generation engineer.
    """
    def __init__(self, unique_latitude_longitude_file):
        # We use a client attribute here, but initialize it inside the method 
        # to ensure it's available when the method is called.
        self.latitude_longitude_file = unique_latitude_longitude_file
        self.client = genai.Client()
        
    def directions(self, user_prompt):
        # pydantic? 
        system_instruction_text = (
            "You are a Data Simulation Director specializing in environmental data engineering. "
            "Your primary and sole task is to take a client's request (User Prompt) and convert it into "
            "a highly structured, technical specification suitable for immediate execution by a "
            "synthetic data generation system (the Data Engineer). "
            "The simulation takes place in the Puget Sound / King County region, WA. "
            
            "\n\nYour output MUST be a complete, well-defined prompt containing all quantifiable parameters."
            
            "\n\nMANDATORY INFERENCES AND DATA POINTS:"
            "\n1. Target Metric and Unit: You MUST explicitly define the environmental metric (e.g., 'NO2', 'PM2.5', 'Noise Level') and its appropriate unit (e.g., 'ppb', 'μg/m³', 'dB')."
            "\n2. Target Timeframe: If the client does not specify the time, you MUST assume a plausible future date (e.g., the next calendar year) and state the assumed Year clearly. Do not ask for the date."
            "\n3. Base Statistics: You MUST determine and define a 'Base Mean' and 'Standard Deviation' for the pollution amount that aligns with the scenario's severity (e.g., low-severity scenario = low mean)."
            "\n4. Spatial Scaling Rules: You MUST define at least two concrete, quantifiable 'Scaling Rules' that describe how pollution intensity should vary spatially (e.g., '1.5x increase in the urban center near I-5' or '40% decrease near protected park lands')."
            
            "\n\nYour final response MUST contain only the structured specification, starting with 'Scenario Specification:'. Do not include any commentary or surrounding text."
        )
        
        config = types.GenerateContentConfig(
            system_instruction=system_instruction_text
        )
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[user_prompt],
            config=config
        )
        return response.text
    
    def pass_dummy_csv(self):
        return self.latitude_longitude_file

class GeminiDataEngineer:
    
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-2.5-flash"
        
    def simulate(self, director_prompt, dummy_file):
        
        # Load the mandatory latitude/longitude coordinates
        df_input = pd.read_csv(dummy_file)
        # RENAMED COLUMNS for cleaner JSON keys
        unique_locations = df_input.rename(
            columns={'Latitude': 'lat', 'Longitude': 'lon'}
        ).drop_duplicates()
        
        # Convert the location list to JSON
        location_list = unique_locations.to_json(orient='records', indent=2)
        
        # --- System Instruction ---
        system_instruction = (
            "You are a highly skilled, freelance Data Engineer using Gemini Pro. "
            "Your task is to take the director's prompt and a list of mandatory output locations. "
            "You MUST generate a list of JSON objects where each object corresponds EXACTLY to one of the "
            "mandatory locations provided. You must invent a realistic 'value' (Pollutant Amount) "
            "based on the Director's request and the geographic location. "
            "Your output MUST strictly adhere to the provided JSON schema."
        )
        
        # --- Minimal JSON Schema ---
        minimal_json_schema = {
            "type": "object",
            "properties": {
                "metric": {"type": "string"},    
                "unit": {"type": "string"},      
                "dataPoints": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "lat": {"type": "number"},
                            "lon": {"type": "number"},
                            "value": {"type": "number"}
                        },
                        "required": ["lat", "lon", "value"]
                    }
                }
            },
            "required": ["metric", "unit", "dataPoints"]
        }
        
        user_query = f"""
                Director's Prompt: {director_prompt}

                Mandatory Locations (you must generate data for ALL of these):
                {location_list}

                Please generate simulated data for all the mandatory locations above. 
                Return ONLY a valid JSON object matching the schema with metric, unit, and dataPoints.
                """
        
        response = self.client.models.generate_content(
            model=self.model,
            contents=user_query,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "response_schema": minimal_json_schema
            }
        )
        
        simulated_data = json.loads(response.text)
        
        # Post-processing: Normalization
        data_points = simulated_data.get("dataPoints", [])
        
        if not data_points:
            simulated_data["baseline"] = {"min": 0, "max": 0, "average": 0}
            return simulated_data
            
        values = [point.get("value", 0) for point in data_points]
        
        min_val = min(values)
        max_val = max(values)
        range_val = max_val - min_val
        
        # Add normalized values to each data point
        for point in data_points:
            # Add normalized value (0 to 1 scale)
            if range_val == 0:
                point["normalized"] = 0.5
            else:
                point["normalized"] = (point["value"] - min_val) / range_val
            
        # Add baseline statistics
        simulated_data["baseline"] = {
            "min": min_val,
            "max": max_val,
            "average": sum(values) / len(values)
        }
        
        return simulated_data
