from google import genai
from google.genai import types
import pandas as pd
import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from typing import List, Literal, Dict

# Ensure environment variables are loaded for the client initialization
load_dotenv()

# Define valid metric-unit combinations
METRIC_UNIT_MAPPING: Dict[str, str] = {
    "NO2": "ppb",
    "PM2.5": "μg/m³",
    "GWP": "kg CO2e/m²",
    "AQI": "NA"
}

# Map metric to CSV column name
METRIC_TO_CSV_COLUMN: Dict[str, str] = {
    "NO2": "NO2 Avg. (ppb)",
    "PM2.5": "PM2.5 Avg. (µg/m³)",
    "GWP": "GWP (CO2e per capita",
    "AQI": "Annual Avg. AQI (0-500)"
}

class CountyDataPoint(BaseModel):
    """Schema for individual county data point output."""
    name: str = Field(description="County name")
    lat: float = Field(description="Latitude")
    lon: float = Field(description="Longitude")
    seat: str = Field(description="County seat")
    density: int = Field(description="Population density")
    ground_truth_value: float = Field(ge=0, description="Real baseline value from CSV for this county")
    scenario_factor: float = Field(description="Scenario modification factor for this county (e.g., 0.6 for 40% reduction)")
    predicted_value: float = Field(ge=0, description="LLM-generated predicted value for this county under the scenario")
    normalized: float = Field(ge=0, le=1, description="Normalized value 0-1 for visualization")

class ScenarioSpecification(BaseModel):
    """Pydantic model for the Director's structured output."""
    
    target_metric: Literal[
        "NO2", "PM2.5", "GWP", "AQI"
    ] = Field(
        description="The environmental metric to simulate"
    )
    
    unit: Literal[
        "ppb", "μg/m³", "kg CO2e/m²", "NA"
    ] = Field(
        description="The appropriate unit for the metric"
    )
    
    target_timeframe: str = Field(
        description="The target year or timeframe for the simulation (e.g., '2025', 'next year')"
    )
    
    standard_deviation: float = Field(
        ge=0,
        description="Standard deviation for random variation in generated values"
    )
    
    scenario_description: str = Field(
        min_length=10,
        max_length=500,
        description="A brief description of the scenario being simulated"
    )
    


class DirectorofDataEngineering:
    """
    Converts a natural language user prompt into a structured, technical 
    specification for the data generation engineer.
    """
    
    def __init__(self, unique_latitude_longitude_file):
        self.latitude_longitude_file = unique_latitude_longitude_file
        self.client = genai.Client()
        
    def directions(self, user_prompt):
        """Convert user prompt into structured scenario specification using Pydantic model."""
        
        system_instruction_text = (
            "You are a Data Simulation Director specializing in environmental data engineering. "
            "Your primary and sole task is to take a client's request (User Prompt) and convert it into "
            "a highly structured, technical specification suitable for immediate execution by a "
            "synthetic data generation system (the Data Engineer). "
            
            "You must analyze the user prompt and extract the following information:"
            "\n1. Target Metric: Choose from: NO2, PM2.5, GWP, AQI"
            "\n2. Unit: Use the standard unit for each metric:"
            "\n   - NO2: ppb"
            "\n   - PM2.5: μg/m³"
            "\n   - GWP: kg CO2e/m²"
            "\n   - AQI: NA"
            "\n3. Timeframe: Target year (assume next year if not specified)"
            "\n4. Standard Deviation: Variation amount for randomness (typically 1-5)"
            "\n5. Description: Brief summary of the scenario (10-500 characters)"
            
            "Return ONLY a valid JSON object with these exact fields:"
            "\n- target_metric: string (from the list above)"
            "\n- unit: string (compatible with the metric)"
            "\n- target_timeframe: string"
            "\n- standard_deviation: number (≥ 0)"
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
        """Return the path to the latitude/longitude CSV file."""
        return self.latitude_longitude_file

class GeminiDataEngineer:
    """
    Generates simulated environmental data based on technical specifications.
    """
    
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-2.5-flash-lite"
        
    def simulate(self, director_prompt, dummy_file):
        """
        Generate simulated environmental data based on director specifications.
        
        Args:
            director_prompt: Technical specification from the director
            dummy_file: Path to CSV file with location data
            
        Returns:
            Dict containing simulated data with CountyDataPoint objects
        """
        import random
        
        print(f"Generating simulated data for director prompt: {director_prompt}")
        
        # Parse the director's specification
        try:
            director_spec = json.loads(director_prompt)
            target_metric = director_spec.get('target_metric', 'NO2')
            unit = director_spec.get('unit', 'ppb')
            std_dev = director_spec.get('standard_deviation', 2.0)
            scenario_description = director_spec.get('scenario_description', 'Default scenario')
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing director specification: {e}")
            # Fallback to defaults
            target_metric = 'NO2'
            unit = 'ppb'
            std_dev = 2.0
            scenario_description = 'Default scenario'
        
        # Load the CSV data
        df_input = pd.read_csv(dummy_file)
        
        # Get the CSV column for the target metric
        csv_column = METRIC_TO_CSV_COLUMN.get(target_metric, 'NO2 Avg. (ppb)')
        
        # Use LLM to generate county-specific scenario factors
        data_points = []
        predicted_values = []
        
        # Prepare county data for LLM
        county_data = []
        for _, row in df_input.iterrows():
            county_info = {
                "name": row['County Name'],
                "lat": float(row['Latitude']),
                "lon": float(row['Longitude']),
                "seat": row['County Seat'],
                "density": int(row['Pop. Density']),
                "ground_truth_value": float(row[csv_column])
            }
            county_data.append(county_info)
        
        # Generate county-specific predicted values using LLM
        county_predictions = self._generate_county_predictions(
            director_spec, county_data, target_metric, scenario_description
        )
        
        for i, county_info in enumerate(county_data):
            name = county_info['name']
            lat = county_info['lat']
            lon = county_info['lon']
            seat = county_info['seat']
            density = county_info['density']
            ground_truth_value = county_info['ground_truth_value']
            
            # Get LLM-generated predicted value for this county
            predicted_value = county_predictions.get(name, ground_truth_value)  # Default to current value if not found
            
            # Calculate scenario factor for display purposes
            scenario_factor = predicted_value / ground_truth_value if ground_truth_value > 0 else 1.0
            
            predicted_values.append(predicted_value)
            
            # Create CountyDataPoint object
            data_point = CountyDataPoint(
                name=name,
                lat=lat,
                lon=lon,
                seat=seat,
                density=density,
                ground_truth_value=ground_truth_value,
                scenario_factor=scenario_factor,
                predicted_value=predicted_value,
                normalized=0.0  # Will be calculated below
            )
            data_points.append(data_point)
        
        # Calculate normalization
        if predicted_values:
            min_val = min(predicted_values)
            max_val = max(predicted_values)
            range_val = max_val - min_val
            
            # Update normalized values
            for i, data_point in enumerate(data_points):
                if range_val == 0:
                    data_point.normalized = 0.5
                else:
                    data_point.normalized = (predicted_values[i] - min_val) / range_val
        
        # Create response with CountyDataPoint objects
        simulated_data = {
            "metric": target_metric,
            "unit": unit,
            "scenario_description": scenario_description,
            "dataPoints": [point.model_dump() for point in data_points],
            "baseline": {
                "min": min(predicted_values) if predicted_values else 0,
                "max": max(predicted_values) if predicted_values else 0,
                "average": sum(predicted_values) / len(predicted_values) if predicted_values else 0
            }
        }
        
        return simulated_data
    
    def _generate_county_predictions(self, director_spec, county_data, target_metric, scenario_description):
        """
        Use LLM to generate county-specific predicted values based on local characteristics.
        
        Args:
            director_spec: Director's specification
            county_data: List of county information
            target_metric: The environmental metric being analyzed
            scenario_description: Description of the scenario
            
        Returns:
            Dict mapping county names to predicted values
        """
        # Prepare county information for LLM
        county_list = []
        for county in county_data:
            county_info = f"""
            County: {county['name']}
            Seat: {county['seat']}
            Population Density: {county['density']} people/sq mi
            Current {target_metric}: {county['ground_truth_value']} {director_spec.get('unit', 'ppb')}
            Location: {county['lat']:.4f}, {county['lon']:.4f}
            """
            county_list.append(county_info)
        
        counties_text = "\n".join(county_list)
        
        system_instruction = (
            f"You are an environmental data expert analyzing how a scenario affects different counties. "
            f"SCENARIO: {scenario_description}\n"
            f"METRIC: {target_metric}\n\n"
            
            f"Your task is to predict the new {target_metric} value for each county under this scenario. "
            f"Consider:"
            f"\n- Local characteristics (urban/rural, industry, geography)"
            f"\n- Current pollution levels"
            f"\n- How the scenario would specifically affect that county"
            f"\n- Population density and local economy"
            f"\n- Realistic environmental science principles"
            f"\n\n"
            f"IMPORTANT: Your predicted values should be scientifically realistic and logically consistent:"
            f"\n- If scenario reduces pollution sources, values should be LOWER than current"
            f"\n- If scenario increases pollution sources, values should be HIGHER than current"
            f"\n- Consider the magnitude of change based on local impact"
            f"\n\n"
            f"Return ONLY a JSON object with county names as keys and predicted values as values:"
            f"\n{{\"King\": 18.5, \"Adams\": 2.2, \"Benton\": 6.3, ...}}"
        )
        
        user_query = f"""
        Analyze these Washington counties and predict their new {target_metric} values under this scenario:
        
        {counties_text}
        
        Return a JSON object with county names as keys and predicted values as values.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=user_query,
                config={
                    "system_instruction": system_instruction,
                    "response_mime_type": "application/json"
                }
            )
            
            county_factors = json.loads(response.text)
            return county_factors
            
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating county predictions: {e}")
            # Fallback to simple percentage reduction based on density
            fallback_predictions = {}
            for county in county_data:
                density = county['density']
                current_value = county['ground_truth_value']
                
                # Apply different reduction percentages based on density
                if density > 500:
                    # Urban areas: 40% reduction
                    fallback_predictions[county['name']] = current_value * 0.6
                elif density > 100:
                    # Suburban areas: 20% reduction  
                    fallback_predictions[county['name']] = current_value * 0.8
                else:
                    # Rural areas: 10% reduction
                    fallback_predictions[county['name']] = current_value * 0.9
            return fallback_predictions
