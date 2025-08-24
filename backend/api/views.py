# backend/api/views.py
from murf.client import Murf
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
from openai import OpenAI

# --- Initialize the Murf client with the hardcoded API key ---
# Replace "YOUR_API_KEY" with your actual Murf AI API key
try:
    client = Murf(api_key="ap2_80180134-95ec-41f8-accd-d20691c64591")
except Exception as e:
    print(f"Failed to initialize Murf client: {e}")
    client = None

# --- OpenRouter (LLM) Client Initialization ---
try:
    llm_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key="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",
    )
except Exception as e:
    print(f"Failed to initialize OpenAI client for OpenRouter: {e}")
    llm_client = None

def get_llm_response(query_text, screenshot_uri):
    if not llm_client:
        return "LLM client is not initialized."

    try:
        completion = llm_client.chat.completions.create(
            extra_headers={ "HTTP-Referer": "http://localhost:3000", "X-Title": "Murf Vision Assistant" },
            model="google/gemma-3-4b-it:free", # A fast and capable model
            messages=[
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": query_text },
                        {
                            "type": "image_url",
                            "image_url": { "url": screenshot_uri } # Pass the screenshot data directly
                        }
                    ]
                }
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling OpenRouter: {e}")
        return "Sorry, I encountered an error trying to analyze the image."

class ProcessQueryView(APIView):
    def post(self, request, *args, **kwargs):
        if not client:
            return Response({"error": "Murf client not initialized."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 1. Get text from the frontend
        query_text = request.data.get('query')
        screenshot_data = request.data.get('screenshot')
        if not query_text:
            return Response({"error": "No query text provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Received query: {query_text}")
        if screenshot_data:
            # Print the first 100 characters to confirm we got it
            print(f"Screenshot data received: {screenshot_data[:100]}...")
        else:
            print("No screenshot data received.")
        llm_response_text = get_llm_response(query_text, screenshot_data)
        print(f"LLM Response: {llm_response_text}")

        # 2. Generate speech using the Murf SDK
        try:
            tts_response = client.text_to_speech.generate(
                text=llm_response_text,
                voice_id="en-UK-ruby"
            )
            audio_url = tts_response.audio_file
            print(f"Successfully generated Murf audio: {audio_url}")

            # 3. Send the audio URL back to the frontend
            return Response(
                {"audioUrl": audio_url}, 
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print(f"An error occurred with the Murf SDK: {e}")
            return Response(
                {"error": "Failed to generate speech with Murf AI."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )