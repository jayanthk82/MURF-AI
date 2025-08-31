document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('mic-button');
    const statusText = document.getElementById('status-text');

    // --- New Helper Function to toggle the visual effect ---
    function togglePageEffect(enable) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: (isEnabled) => {
                        document.documentElement.classList.toggle('murf-vision-active', isEnabled);
                    },
                    args: [enable]
                });
            }
        });
    }

    // --- Turn ON the effect when the popup opens ---
    togglePageEffect(true);

    // --- Speech Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        statusText.textContent = "Sorry, your browser doesn't support speech recognition.";
        micButton.disabled = true;
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    let finalTranscript = '';
    let isRecording = false;

    recognition.onstart = () => {
        statusText.textContent = 'Listening...';
        finalTranscript = '';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        statusText.textContent = finalTranscript + interimTranscript;
    };

    recognition.onend = () => {
        isRecording = false;
        micButton.classList.remove('recording');
        if (finalTranscript) {
            takeScreenshotAndSend(finalTranscript);
        } else {
            statusText.textContent = 'Could not hear you. Please try again.';
            togglePageEffect(false); // Turn off effect if there's no speech
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        statusText.textContent = 'An error occurred during speech recognition.';
        togglePageEffect(false); // Turn off effect on error
    };

    micButton.addEventListener('click', () => {
        isRecording = !isRecording;
        if (isRecording) {
            micButton.classList.add('recording');
            recognition.start();
        } else {
            micButton.classList.remove('recording');
            recognition.stop();
        }
    });

    async function takeScreenshotAndSend(queryText) {
        statusText.textContent = 'Taking screenshot...';
        
        try {
            const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 90 });

            statusText.textContent = 'Analyzing...';
            
            const response = await fetch('http://127.0.0.1:8000/api/process-query/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryText, screenshot: screenshotDataUrl }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            
            if (data.audioUrl) {
                statusText.textContent = 'Playing response...';
                const audio = new Audio(data.audioUrl);
                audio.play();
                audio.onended = () => {
                    // --- Turn OFF the effect when the audio is done ---
                    togglePageEffect(false);
                    window.close();
                };
            } else {
                throw new Error('No audio URL in response.');
            }

        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'An error occurred. See console.';
            // --- Turn OFF the effect if there's a backend error ---
            togglePageEffect(false);
        }
    }
});