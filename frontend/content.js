// --- Create the Assistant UI ---
const assistantContainer = document.createElement('div');
assistantContainer.id = 'murf-assistant-container';
assistantContainer.innerHTML = `
  <div class="murf-assistant-bar">
    <button id="murf-mic-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14Zm-1 7v-3.075q-2.6-.35-4.3-2.325T4 11H6q0 2.075 1.463 3.537T11 16v-1q-1.25 0-2.125-.875T8 13V7h2v4q0 .425.288.713T11 12q.425 0 .713-.288T12 .713.287T13 11V7h2v6q0 1.25-.875 2.125T12 16v1q2.075 0 3.538-1.463T17 11h2q0 2.5-1.7 4.475T13 17.925V21h-2Z"/></svg>
    </button>
    <p id="murf-status-text">Click the mic to start speaking</p>
  </div>
`;
document.body.appendChild(assistantContainer);
document.body.classList.add('murf-active-border'); // Add the blue border

// --- Speech Recognition ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
let finalTranscript = '';

recognition.onstart = () => {
  document.getElementById('murf-status-text').textContent = 'Listening...';
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
  document.getElementById('murf-status-text').textContent = finalTranscript + interimTranscript;
};

recognition.onend = () => {
  document.getElementById('murf-status-text').textContent = 'Processing...';
  takeScreenshotAndSend();
};

// --- Mic Button ---
let isRecording = false;
const micButton = document.getElementById('murf-mic-button');
micButton.addEventListener('click', () => {
  isRecording = !isRecording;
  if (isRecording) {
    micButton.classList.add('recording');
    finalTranscript = '';
    recognition.start();
  } else {
    micButton.classList.remove('recording');
    recognition.stop();
  }
});

// --- Screenshot and Backend Communication ---
async function takeScreenshotAndSend() {
  const screenshotTarget = document.body;
  const canvas = await html2canvas(screenshotTarget);
  const screenshotData = canvas.toDataURL('image/jpeg');

  const response = await fetch('https://murf-ai-eh9w.onrender.com/api/process-query/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: finalTranscript,
      screenshot: screenshotData,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const audio = new Audio(data.audioUrl);
    audio.play();
    document.getElementById('murf-status-text').textContent = 'Click the mic to start speaking';
  } else {
    console.error('Error from backend:', response.statusText);
    document.getElementById('murf-status-text').textContent = 'Error. Please try again.';
  }
}

// We need to inject the html2canvas library into the page
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
document.head.appendChild(script);