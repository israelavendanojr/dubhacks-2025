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

    def classify_prompt_relevance(self, user_prompt):
        """Classify the user prompt to ensure it is a valid prompt."""
        classification_prompt = f"""
        Determine if the user prompt is relevant to environmental data simulation, and if it makes sense to model.
        
        A prompt is RELEVANT if it's about:
        - Environmental scenarios (pollution, emissions, climate change)
        - Air quality, water quality, soil conditions
        - Transportation impacts (cars, planes, ships)
        - Industrial changes, policy changes affecting environment
        - Natural disasters, weather events
        - Energy production, renewable energy
        - Urban planning, infrastructure changes
        
        A prompt MAKES SENSE TO MODEL if:
        - There's a logical, scientifically plausible connection between the scenario and environmental impact
        - The scenario could realistically affect pollution, emissions, or environmental metrics
        - The impact is measurable and significant enough to model
        
        Examples of what DOESN'T make sense to model:
        - "How will chewing bubblegum affect climate?" (no logical connection)
        - "What if everyone wore red shirts?" (no environmental impact)
        - "Impact of eating ice cream on air quality" (no scientific basis)
        
        User Prompt: "{user_prompt}"
        
        Return ONLY a valid JSON object with these exact fields:
        - relevant: boolean
        - makes_sense_to_model: boolean  
        - reason: string
        - suggestions: list of strings
        """

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=classification_prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            classification = json.loads(response.text)
            
            # Validate the response structure
            if not isinstance(classification, dict):
                return False
                
            # Check both conditions
            is_relevant = classification.get('relevant', False)
            makes_sense = classification.get('makes_sense_to_model', False)
            
            # Both must be true to proceed
            return is_relevant and makes_sense
            
        except Exception as e:
            print(f"Error classifying prompt relevance: {e}")
            return False  # Default to safe side

        
    def directions(self, user_prompt):
        classification = self.classify_prompt_relevance(user_prompt)
        if not classification:
            return json.dumps({
                "error": "INVALID_PROMPT",
                "message": "This prompt is not related to environmental data simulation. Please provide a scenario about environmental impacts, pollution, climate change, or similar topics.",
                "suggestions": [
                    "Try: 'What happens if we remove all electric vehicles?'",
                    "Try: 'Impact of closing all coal power plants'",
                    "Try: 'Effect of doubling renewable energy production'"
                ]
            })

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
            Dict containing simulated data with CountyDataPoint objects, or error dict
        """
        import random
        
        # Check if director returned an error response
        try:
            parsed_prompt = json.loads(director_prompt)
            if "error" in parsed_prompt:
                # Return the error directly to stop processing
                return parsed_prompt
        except json.JSONDecodeError:
            # If it's not valid JSON at all, return an error
            return {
                "error": "INVALID_SPECIFICATION",
                "message": "Director failed to generate a valid specification.",
                "suggestions": ["Please try rephrasing your prompt."]
            }
        
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
    
    def generate_county_insights(self, simulation_data):
        """
        Generate LLM insights for all counties based on simulation data.
        
        Args:
            simulation_data: The full simulation response data
            
        Returns:
            Dict mapping county names to insight strings
        """
        try:
            # Extract data from simulation response
            metric = simulation_data.get('metric', 'NO2')
            unit = simulation_data.get('unit', 'ppb')
            scenario_description = simulation_data.get('scenario_description', 'Environmental scenario')
            data_points = simulation_data.get('dataPoints', [])
            baseline = simulation_data.get('baseline', {})
            
            # Prepare county data for LLM
            county_analysis = []
            for point in data_points:
                # Ensure all required data points are included for the LLM to reference
                county_info = f"""
                County: {point['name']}
                County Seat: {point['seat']}
                Population Density: {point['density']} people/sq mi
                Ground Truth (Baseline) {metric}: {point['ground_truth_value']:.1f} {unit}
                Predicted {metric}: {point['predicted_value']:.1f} {unit}
                Scenario Factor (Change Ratio): {point['scenario_factor']:.4f}x (Note: 1.0 = No Change)
                Normalized Risk Score: {point.get('normalized', 0.0):.4f} (0=Min, 1=Max)
                Location: {point['lat']:.4f}, {point['lon']:.4f}
                """
                county_analysis.append(county_info)
            
            counties_text = "\n".join(county_analysis)
            
            # --- REVISED SYSTEM INSTRUCTION FOR TECHNICAL INSIGHTS ---
            system_instruction = (
                f"**Persona:** You are a Senior Climate Data Scientist and GIS Analyst specializing in the localized impact of environmental scenarios. "
                f"Your analysis must be technically rigorous and grounded entirely in the numerical data provided. "
                
                f"**SCENARIO:** {scenario_description}\n"
                f"**METRIC:** {metric} ({unit})\n"
                f"**BASELINE CONTEXT:** State average {metric}={baseline.get('average', 0):.1f} {unit}. "
                
                f"Your task is to generate a concise, impressive, and technical 2-3 sentence insight for each county. "
                f"The insight must explicitly address the following criteria in a fluid, non-bulleted paragraph:"
                f"\n1. **Causal Mechanism:** Explain the predicted change by referencing the **Scenario Factor** (e.g., 'a 0.9375x factor') and calculating the precise percentage change (e.g., 'a 6.25% reduction')."
                f"\n2. **Explanatory Variables:** Correlate the **Population Density** or geographic location (e.g., near coast/major cities) with the Scenario Factor to hypothesize a technical reason for the specific impact (e.g., proximity to air freight hubs, or low population/rural area immunity)."
                f"\n3. **Implication:** Discuss a real-world, data-driven implication of this change on the county's infrastructure, logistics, or regional economy."
                
                f"\n\n**Output Requirement:** Return ONLY a JSON object with county names as keys and the technical insight string as the value. Do NOT use markdown in the JSON values."
                f"\n{{\"King\": \"Analysis indicates a 9.5% GWP reduction (Factor 0.905x) which is amplified by high density and major airport infrastructure...\", ...}}"
            )
            # --------------------------------------------------------
            
            user_query = f"""
            Analyze these Washington counties and provide the required technical insights for each:
            
            {counties_text}
            
            Return a JSON object with county names as keys and the technical insight strings as values.
            """
            
            # Assuming self.client and self.model are configured for the LLM API call
            response = self.client.models.generate_content(
                model=self.model,
                contents=user_query,
                config={
                    "system_instruction": system_instruction,
                    "response_mime_type": "application/json"
                }
            )
            
            insights = json.loads(response.text)
            return insights
            
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating county insights: {e}")
            # Fallback logic remains the same
            fallback_insights = {}
            for point in data_points:
                county_name = point['name']
                density = point['density']
                predicted = point['predicted_value']
                current = point['ground_truth_value']
                change = point['scenario_factor']
                
                if density > 500:
                    area_type = "urban"
                elif density > 100:
                    area_type = "suburban"
                else:
                    area_type = "rural"
                
                change_percent = (1 - change) * 100
                if change_percent > 10:
                    trend = "significant reduction"
                elif change_percent >= 0:
                    trend = "moderate reduction"
                else:
                    trend = "marginal increase"

                fallback_insights[county_name] = (
                    f"As a {area_type} county (Density: {density} per sq mi), the predicted {metric} level of {predicted:.1f} {unit} "
                    f"represents a {trend} of {abs(change_percent):.1f}% from the baseline of {current:.1f} {unit} (Factor: {change:.4f}x). "
                    f"The impact suggests a measurable decrease in local emissions linked to reduced air-traffic support infrastructure."
                )
            
            return fallback_insights