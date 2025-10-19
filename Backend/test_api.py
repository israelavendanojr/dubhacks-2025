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
    base_url = "http://127.0.0.1:8000/"
    simulate_url = f"{base_url}/api/simulate"
    
    # First test basic connectivity
    try:
        print("Testing basic connectivity...")
        health_response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Health check status: {health_response.status_code}")
        if health_response.status_code == 200:
            print("Server is running and responding")
        else:
            print("Server health check failed")
            return
    except Exception as e:
        print(f"Cannot connect to server: {e}")
        return
    
    # Sample test data
    test_prompt = {
        "prompt": "What would air quality look like if all of the cars were electric?"
    }
    
    try:
        print(f"Test Prompt: {test_prompt}")
        print("-" * 50)
        
        # Add explicit headers and debug info
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        print(f"Making POST request to: {simulate_url}")
        print(f"Headers: {headers}")
        print(f"Data: {json.dumps(test_prompt)}")
        
        # Make the request with explicit headers
        response = requests.post(simulate_url, json=test_prompt, headers=headers, timeout=300)
        
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("API Response:")
            print(json.dumps(data, indent=2))
        else:
            print(f"API Test Failed!")
            print(f"Status Code: {response.status_code}")
            print(f"Response Text: {response.text}")
            print(f"Response Content: {response.content}")
            
    except requests.exceptions.ConnectionError:
        print("Connection Error: Make sure the API server is running!")
        print("Run: uvicorn main:app --reload")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_api()
