#!/usr/bin/env python3
"""
Simple test script to verify the API setup.
Run this after setting up your .env file with a valid GOOGLE_API_KEY.
"""

import requests
import json

def test_api():
    """Test the /api/simulate endpoint with a sample prompt."""
    
    # API endpoint
    url = "http://localhost:8000/api/simulate"
    
    # Sample test data
    test_prompt = {
        "prompt": "What would air quality look like if all of the cars were electric?"
    }
    
    try:
        print("Test Prompt:", {test_prompt})
        print("-" * 50)
        # Make the request
        response = requests.post(url, json=test_prompt)
        
        if response.status_code == 200:
            data = response.json()
            print("API Response:")
            print(json.dumps(data, indent=2))
        else:
            print(f"API Test Failed!")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Connection Error: Make sure the API server is running!")
        print("Run: uvicorn main:app --reload")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_api()
