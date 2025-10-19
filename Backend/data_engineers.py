from google import genai
import os
from dotenv import load_dotenv
from google.genai import types
import pandas as pd
import json

load_dotenv()

class DirectorofDataEngineering:
    def __init__(self, unique_latitude_longitude_file):
        self.latitude_longitude_file = unique_latitude_longitude_file
        
    def directions(self, user_prompt):
        client = genai.Client()
        
        system_instruction_text = (
            "You are a Data Simulation Director specializing in environmental data engineering. "
            "Your primary and sole task is to take a client's request (User Prompt) and convert it into "
            "a highly structured, technical specification suitable for immediate execution by a "
            "synthetic data generation system (the Data Engineer). "
            "The simulation takes place in the Puget Sound / King County region, WA. "
            
            "\n\nYour output MUST be a complete, well-defined prompt containing all quantifiable parameters."
            
            "\n\nMANDATORY INFERENCES AND DATA POINTS:"
            "\n1. Target Year and Target Month: If the client does not specify the time, you MUST assume a plausible future date (e.g., the next calendar month) and state the assumed Year and Month clearly. Do not ask for the date."
            "\n2. Base Statistics: You MUST determine and define a 'Base Mean' and 'Standard Deviation' for the pollution amount (assuming NO2 in ppb) that aligns with the scenario's severity (e.g., low-severity scenario = low mean)."
            "\n3. Spatial/Temporal Rules: You MUST define at least two concrete, quantifiable 'Scaling Rules' that describe how pollution intensity should vary spatially (e.g., '1.5x increase in the urban center') or temporally (e.g., 'amounts decrease 20% in the last week')."
            
            "\n\nYour final response MUST contain only the structured specification, starting with 'Scenario Specification:'. Do not include any commentary or surrounding text."
        )
        
        config = types.GenerateContentConfig(
            system_instruction=system_instruction_text
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[user_prompt],
            config=config
        )
        return response.text
    
    def pass_dummy_csv(self):
        return self.latitude_longitude_file

class GeminiDataEngineer:
    
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-2.5-pro"
        
    def simulate(self, director_prompt, dummy_file):
        # Load the mandatory latitude/longitude coordinates
        df_input = pd.read_csv(dummy_file)
        location_cols = ['Latitude', 'Longitude']
        unique_locations = df_input[location_cols].drop_duplicates()
        location_list = unique_locations.to_json(orient='records')
        
        # Construct the full system instruction and user query
        system_instruction = (
            "You are a highly skilled, freelance Data Engineer using Gemini Pro. "
            "Your task is to take the director's prompt, the historical context provided by the dummy data, "
            "and a list of mandatory output locations (Latitude/Longitude pairs). "
            "You MUST generate a list of JSON objects where each object corresponds EXACTLY to one of the "
            "mandatory Latitude/Longitude pairs provided. You must invent realistic pollution values "
            "based on the director's request. Your output MUST strictly adhere "
            "to the provided JSON schema."
        )
        
        # Minimal JSON Schema as specified
        minimal_json_schema = {
            "type": "object",
            "properties": {
                "metric": {"type": "string"},    # e.g., "NO2"
                "unit": {"type": "string"},      # e.g., "ppb"
                "dataPoints": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "lat": {"type": "number"},
                            "lon": {"type": "number"},
                            "value": {"type": "number"} # The raw pollution amount
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
                Each dataPoint should have lat, lon, and value fields.
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
        data_points = simulated_data["dataPoints"]
        values = [point["value"] for point in data_points]
        
        min_val = min(values)
        max_val = max(values)
        range_val = max_val - min_val
        
        # Add normalized values to each data point
        for point in data_points:
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
        
        print(f"Generated {len(data_points)} data points")
        print(f"Value range: {min_val:.2f} - {max_val:.2f}")
        
        return simulated_data
