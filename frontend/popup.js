document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyze-button');
    const queryInput = document.getElementById('query-input');
    const statusText = document.getElementById('status-text');

    analyzeButton.addEventListener('click', async () => {
        const query = queryInput.value;

        if (!query) {
            statusText.textContent = 'Please enter a question.';
            return;
        }

        statusText.textContent = 'Taking screenshot...';
        
        try {
            // 1. Capture the visible tab as a data URL (JPEG)
            const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, {
                format: 'jpeg',
                quality: 90
            });

            statusText.textContent = 'Analyzing...';
            
            // 2. Send data to the backend
            const response = await fetch('http://127.0.0.1:8000/api/process-query/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    screenshot: screenshotDataUrl, // Send the data URL directly
                }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();
            
            // 3. Play the audio response
            if (data.audioUrl) {
                statusText.textContent = 'Playing response...';
                const audio = new Audio(data.audioUrl);
                audio.play();
                audio.onended = () => {
                   statusText.textContent = ''; // Clear status when done
                   window.close(); // Close popup after playing
                };
            } else {
                throw new Error('No audio URL received from server.');
            }

        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = 'An error occurred. See console.';
        }
    });
});