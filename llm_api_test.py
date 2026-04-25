from google import genai
import os

# Initialize the client
# Ensure you have set the GOOGLE_API_KEY environment variable
# or pass api_key="YOUR_API_KEY" to the Client constructor
client = genai.Client(api_key="AIzaSyDze9GyENqMGQKhMrKcPwtALZmC403rBc4")

# Generate content using the Gemma 4 31B Instruct model
response = client.models.generate_content(
    model="gemma-4-31b-it",
    contents="Explain the theory of general relativity in a few words"
)

print(response.text)
