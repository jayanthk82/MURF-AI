document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('mic-button');
    const statusText = document.getElementById('status-text');

    // --- Helper to check if script injection is allowed ---
    function isRestrictedUrl(url) {
        if (!url) return true; // content scripts can't run on undefined urls
        const restricted = ['chrome://', 'edge://', 'about:', 'chrome-extension://'];
        return restricted.some(protocol => url.startsWith(protocol));
    }

    // --- Helper Function to toggle the visual effect ---
    function togglePageEffect(enable) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            
            // SECURITY CHECK: Do not try to inject scripts on restricted pages
            if (activeTab && activeTab.id && !isRestrictedUrl(activeTab.url)) {
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    func: (isEnabled) => {
                        document.documentElement.classList.toggle('murf-vision-active', isEnabled);
                    },
                    args: [enable]
                }).catch(err => {
                    // Fail silently if injection fails (e.g. on restricted domains missed by check)
                    console.warn("Could not toggle effect on this page:", err);
                });
            } else {
                console.log("Skipping visual effect on restricted page.");
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
            togglePageEffect(false); 
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
             statusText.textContent = 'Microphone access blocked. Please allow permissions.';
        } else if (event.error === 'no-speech') {
             statusText.textContent = 'No speech detected.';
        } else {
             statusText.textContent = `Error: ${event.error}`;
        }
        togglePageEffect(false);
    };

    micButton.addEventListener('click', () => {
        if (!isRecording) {
            isRecording = true;
            micButton.classList.add('recording');
            recognition.start();
        } else {
            isRecording = false;
            micButton.classList.remove('recording');
            recognition.stop();
        }
    });

    async function takeScreenshotAndSend(queryText) {
        statusText.textContent = 'Taking screenshot...';
        
        try {
            // Check URL again before screenshotting
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0] && isRestrictedUrl(tabs[0].url)) {
                throw new Error("Cannot run on this system page.");
            }

            const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 90 });

            statusText.textContent = 'Analyzing...';
            
            const response = await fetch('https://murf-ai-5htp.onrender.com/api/process/', {
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
                    togglePageEffect(false);
                };
            } else {
                throw new Error('No audio URL in response.');
            }

        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes("Cannot run")) {
                statusText.textContent = "Cannot run on this system page.";
            } else {
                statusText.textContent = 'An error occurred. See console.';
            }
            togglePageEffect(false);
        }
    }
});