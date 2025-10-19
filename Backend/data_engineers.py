from google import genai
from google.genai import types
import pandas as pd
import json
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Dict

# Ensure environment variables are loaded for the client initialization
load_dotenv()

# Define valid metric-unit combinations
METRIC_UNIT_MAPPING: Dict[str, List[str]] = {
    "NO2": ["ppb", "ppm", "μg/m³"],
    "NOx": ["ppb", "ppm", "μg/m³"],
    "PM2.5": ["μg/m³", "mg/m³"],
    "PM10": ["μg/m³", "mg/m³"],
    "O3": ["ppb", "ppm"],
    "SO2": ["ppb", "ppm", "μg/m³"],
    "CO": ["ppm", "mg/m³"],
    "Noise Level": ["dB"],
    "Temperature": ["°C", "°F"],
    "Humidity": ["%"],
    "Wind Speed": ["m/s", "mph", "km/h"]
}

class ScenarioSpecification(BaseModel):
    """Pydantic model for the Director's structured output."""
    
    target_metric: Literal[
        "NO2", "NOx", "PM2.5", "PM10", "O3", "SO2", "CO", 
        "Noise Level", "Temperature", "Humidity", "Wind Speed"
    ] = Field(
        description="The environmental metric to simulate"
    )
    
    unit: Literal[
        "ppb", "ppm", "μg/m³", "mg/m³", "dB", "°C", "°F", 
        "%", "m/s", "mph", "km/h", "Pa", "hPa"
    ] = Field(
        description="The appropriate unit for the metric"
    )
    
    target_timeframe: str = Field(
        description="The target year or timeframe for the simulation (e.g., '2025', 'next year')"
    )
    
    base_mean: float = Field(
        ge=0,
        description="The base mean value for pollution amounts that aligns with scenario severity"
    )
    
    standard_deviation: float = Field(
        ge=0,
        description="The standard deviation for the pollution distribution"
    )
    
    scaling_rules: List[str] = Field(
        min_length=2,
        description="At least two concrete, quantifiable scaling rules for spatial variation"
    )
    
    scenario_description: str = Field(
        min_length=10,
        max_length=500,
        description="A brief description of the scenario being simulated"
    )
    
    @field_validator('unit')
    @classmethod
    def validate_unit_metric_pair(cls, v, info):
        """Validate that the unit is compatible with the target metric."""
        if 'target_metric' in info.data:
            metric = info.data['target_metric']
            valid_units = METRIC_UNIT_MAPPING.get(metric, [])
            if v not in valid_units:
                valid_units_str = ', '.join(valid_units)
                raise ValueError(
                    f"Unit '{v}' is not valid for metric '{metric}'. "
                    f"Valid units for {metric} are: {valid_units_str}"
                )
        return v

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
        """Convert user prompt into structured scenario specification using Pydantic model."""
        
        system_instruction_text = (
            "You are a Data Simulation Director specializing in environmental data engineering. "
            "Your primary and sole task is to take a client's request (User Prompt) and convert it into "
            "a highly structured, technical specification suitable for immediate execution by a "
            "synthetic data generation system (the Data Engineer). "
            "The simulation takes place in the Puget Sound / King County region, WA. "
            
            "You must analyze the user prompt and extract the following information:"
            "\n1. Target Metric: Choose from: NO2, NOx, PM2.5, PM10, O3, SO2, CO, Noise Level, Temperature, Humidity, Wind Speed"
            "\n2. Unit: MUST be compatible with the metric. Valid combinations:"
            "\n   - NO2/NOx: ppb, ppm, μg/m³"
            "\n   - PM2.5/PM10: μg/m³, mg/m³"
            "\n   - O3: ppb, ppm"
            "\n   - SO2: ppb, ppm, μg/m³"
            "\n   - CO: ppm, mg/m³"
            "\n   - Noise Level: dB"
            "\n   - Temperature: °C, °F"
            "\n   - Humidity: %"
            "\n   - Wind Speed: m/s, mph, km/h"
            "\n3. Timeframe: Target year (assume next year if not specified)"
            "\n4. Base Statistics: Mean and standard deviation based on scenario severity (both must be ≥ 0)"
            "\n5. Scaling Rules: At least 2 spatial variation rules (urban vs rural, etc.)"
            "\n6. Description: Brief summary of the scenario (10-500 characters)"
            
            "Return ONLY a valid JSON object with these exact fields:"
            "\n- target_metric: string (from the list above)"
            "\n- unit: string (compatible with the metric)"
            "\n- target_timeframe: string"
            "\n- base_mean: number (≥ 0)"
            "\n- standard_deviation: number (≥ 0)"
            "\n- scaling_rules: array of strings (minimum 2 items)"
            "\n- scenario_description: string (10-500 characters)"
        )
        
        # Create JSON schema from Pydantic model
        json_schema = ScenarioSpecification.model_json_schema()
        
        config = types.GenerateContentConfig(
            system_instruction=system_instruction_text,
            response_mime_type="application/json"
        )
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=[user_prompt],
            config=config
        )
        
        # Parse and validate the response using Pydantic
        try:
            specification_data = json.loads(response.text)
            validated_spec = ScenarioSpecification(**specification_data)
            return validated_spec.model_dump_json(indent=2)
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback to raw text if parsing fails
            return response.text
    
    def pass_dummy_csv(self):
        return self.latitude_longitude_file
    
    @staticmethod
    def get_specification_model():
        """Return the Pydantic model for scenario specifications."""
        return ScenarioSpecification
    
    @staticmethod
    def get_valid_metrics():
        """Return list of valid target metrics."""
        return [
            "NO2", "NOx", "PM2.5", "PM10", "O3", "SO2", "CO", 
            "Noise Level", "Temperature", "Humidity", "Wind Speed"
        ]
    
    @staticmethod
    def get_valid_units():
        """Return list of all valid units."""
        return [
            "ppb", "ppm", "μg/m³", "mg/m³", "dB", "°C", "°F", 
            "%", "m/s", "mph", "km/h", "Pa", "hPa"
        ]
    
    @staticmethod
    def get_valid_units_for_metric(metric: str) -> List[str]:
        """Return valid units for a specific metric."""
        return METRIC_UNIT_MAPPING.get(metric, [])
    
    @staticmethod
    def get_metric_unit_mapping():
        """Return the complete metric-unit mapping."""
        return METRIC_UNIT_MAPPING

class GeminiDataEngineer:
    
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-2.5-flash-lite"
        
    def simulate(self, director_prompt, dummy_file):
        
        # Load the mandatory latitude/longitude coordinates
        df_input = pd.read_csv(dummy_file)
        # RENAMED COLUMNS for cleaner JSON keys, include location type for factual grounding
        unique_locations = df_input.rename(
            columns={'Latitude': 'lat', 'Longitude': 'lon', 'Location_Type': 'location_type'}
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
            
            "IMPORTANT: Use the location_type field (urban/suburban/rural) to factually ground your values: "
            "- URBAN areas should have higher pollution values (traffic, industry, density) "
            "- SUBURBAN areas should have medium pollution values (some traffic, residential) "
            "- RURAL areas should have lower pollution values (natural, less traffic) "
            
            "Your output MUST strictly adhere to the provided JSON schema."
        )
        
        # --- Minimal JSON Schema ---
        # return blueprint
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
                            "": {},
                            
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
                Each location includes lat, lon, and location_type (urban/suburban/rural).
                Use the location_type to factually ground your pollution values.
                {location_list}

                Please generate simulated data for all the mandatory locations above. 
                Return ONLY a valid JSON object matching the schema with metric, unit, and dataPoints.
                """
        print("--------------------------------")
        print(director_prompt)
        print(location_list)
        print("--------------------------------")
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
