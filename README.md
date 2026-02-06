# Murf AI Vision-Based Voice Assistant

<img width="800" alt="Murf AI Banner" src="https://github.com/user-attachments/assets/8f5da248-840a-4990-bd66-22527bf6bf51" />

This project is a submission for the **MURF AI Coding Challenge**. It's a Chrome extension that acts as a personal AI agent, capable of understanding the content of a user's screen and responding to voice queries with voice answers, powered by the Murf TTS API.

## Key Features

* **Voice-Activated Queries:** Activate the assistant and ask questions using only your voice.
* **Visual Understanding:** The assistant takes a screenshot of your current tab to understand the context of your query.
* **Real-time AI Responses:** Leverages a multimodal Large Language Model (LLM) to generate intelligent answers.
* **Natural Voice Output:** Uses the **Murf AI TTS API** to convert the AI's text response into high-quality, natural-sounding speech.
* **Seamless Integration:** Runs as a lightweight and intuitive Chrome extension on any webpage.

---
## How It Works

The workflow is designed to be seamless and intuitive for the user.

1.  **Activation:** The user clicks the extension icon to launch the full-screen assistant overlay.
2.  **Voice Input:** The user clicks the record button and speaks their query (e.g., "Summarize this article for me.").
3.  **Data Capture:** The extension's content script captures the transcribed text and takes a screenshot of the visible webpage.
4.  **Backend Processing:** The text and screenshot are sent to a cloud-hosted Django backend.
5.  **LLM Analysis:** The backend forwards the data to a multimodal LLM (via OpenRouter) for analysis.
6.  **Voice Generation:** The LLM's text response is sent to the **Murf AI TTS API**, which generates a high-quality audio file.
7.  **Audio Response:** The URL of the audio file is sent back to the extension, which plays it for the user.

---
## Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (Chrome Extension APIs)
* **Backend:** Python, Django, Django REST Framework
* **Text-to-Speech:** **Murf AI TTS API**
* **AI Model:** Multimodal LLM via OpenRouter
* **Deployment:** Gunicorn, Render (Cloud Platform)

---
## Setup and Installation

### Backend

1.  Navigate to the `backend` directory: `cd backend`
2.  Install dependencies: `pip install -r requirements.txt`
3.  Create a `.env` file and add your `MURF_API_KEY` and `OPENROUTER_API_KEY`.
4.  Run the server: `python manage.py runserver`

### Frontend (Chrome Extension)

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"**.
3.  Click **"Load unpacked"** and select the `extension` folder.
4.  Pin the extension to your toolbar for easy access.

---
## Future Scope

The final goal is to help users with an instant, vision-based voice assistant on their web pages. Future improvements could include:
* Streaming audio responses for faster feedback.
* Deeper page context by analyzing the page's HTML content.
* A more conversational, multi-turn dialogue system.
