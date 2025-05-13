document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const textToConvert = document.getElementById('textToConvert');
    const convertBtn = document.getElementById('convertBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const voiceSelect = document.getElementById('voiceSelect');
    const rate = document.getElementById('rate');
    const pitch = document.getElementById('pitch');
    const rateValue = document.getElementById('rateValue');
    const pitchValue = document.getElementById('pitchValue');
    const errorMsg = document.getElementById('errorMsg');
    const charCount = document.getElementById('charCount');
    const historyList = document.getElementById('historyList');
    const speakingAnimation = document.createElement('div');
    
    // Create speaking animation element
    speakingAnimation.className = 'speaking-animation';
    speakingAnimation.innerHTML = '<span></span><span></span><span></span><span></span>';

    // Initialize speech synthesis
    const speechSynth = window.speechSynthesis;
    let voices = [];
    let currentUtterance = null;
    let speechHistory = JSON.parse(localStorage.getItem('speechHistory')) || [];
    
    // Celebrity voices (limited selection of 10)
    const celebrityVoices = [
        { name: "v1", baseVoice: "Google IN English", lang: "en-IN", pitch: 0.9, rate: 0.9 },
        { name: "v2", baseVoice: "Microsoft David", lang: "en-US", pitch: 0.8, rate: 0.9 },
        { name: "v3", baseVoice: "Google US English", lang: "en-US", pitch: 0.7, rate: 0.8 },
        { name: "v4", baseVoice: "Microsoft Zira", lang: "en-US", pitch: 1.4, rate: 1.0 },
        { name: "v5", baseVoice: "Google UK English Male", lang: "en-GB", pitch: 0.8, rate: 0.8 },
        { name: "v6", baseVoice: "Google IN English", lang: "en-IN", pitch: 0.7, rate: 0.85 },
        { name: "v7", baseVoice: "Samantha", lang: "en-US", pitch: 1.2, rate: 0.9 },
        { name: "v8", baseVoice: "Daniel", lang: "en-GB", pitch: 0.7, rate: 0.85 },
        { name: "v9", baseVoice: "Google US English", lang: "en-US", pitch: 1.3, rate: 1.1 },
        { name: "v10", baseVoice: "Microsoft David", lang: "en-US", pitch: 0.9, rate: 0.85 }
    ];

    // Populate voice options once available
    function populateVoiceList() {
        voices = speechSynth.getVoices();
        
        // Clear existing options
        voiceSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Default Voice';
        defaultOption.value = 'default';
        voiceSelect.appendChild(defaultOption);
        
        // Add celebrity voices
        celebrityVoices.forEach((celebrity, index) => {
            const option = document.createElement('option');
            option.textContent = celebrity.name;
            option.value = index.toString();
            option.setAttribute('data-index', index);
            voiceSelect.appendChild(option);
        });
    }

    // Listen for voices to be loaded (can be async)
    if (speechSynth.onvoiceschanged !== undefined) {
        speechSynth.onvoiceschanged = populateVoiceList;
    }
    
    // Initialize voices if already available
    populateVoiceList();

    // Update character count
    textToConvert.addEventListener('input', function() {
        charCount.textContent = this.value.length;
        
        // Clear error message when typing
        errorMsg.textContent = '';
        
        // Add typing animation effect
        textToConvert.style.borderColor = '#ff0066';
        textToConvert.style.boxShadow = '0 0 10px #ff0066, 0 0 20px #ff006680';
        
        setTimeout(() => {
            textToConvert.style.borderColor = '#333';
            textToConvert.style.boxShadow = 'none';
        }, 500);
    });

    // Update rate value display
    rate.addEventListener('input', function() {
        rateValue.textContent = `${this.value}x`;
        
        // Add glow effect to slider
        this.style.boxShadow = '0 0 10px #ff0066, 0 0 20px #ff006680';
        
        setTimeout(() => {
            this.style.boxShadow = 'none';
        }, 500);
    });

    // Update pitch value display
    pitch.addEventListener('input', function() {
        pitchValue.textContent = `${this.value}x`;
        
        // Add glow effect to slider
        this.style.boxShadow = '0 0 10px #ff0066, 0 0 20px #ff006680';
        
        setTimeout(() => {
            this.style.boxShadow = 'none';
        }, 500);
    });

    // Apply voice effects based on selected celebrity
    function applyCelebrityVoice(utterance) {
        if (voiceSelect.value === 'default') {
            // Use custom slider values for default voice
            utterance.pitch = pitch.value;
            utterance.rate = rate.value;
            return;
        }
        
        const celebrityIndex = parseInt(voiceSelect.value);
        const celebrity = celebrityVoices[celebrityIndex];
        
        // Find the closest matching system voice
        let selectedVoice = null;
        
        // Try to match by name and language
        for (let voice of voices) {
            if (voice.name.includes(celebrity.baseVoice) && voice.lang.includes(celebrity.lang.split('-')[0])) {
                selectedVoice = voice;
                break;
            }
        }
        
        // If no match, try just by language
        if (!selectedVoice) {
            for (let voice of voices) {
                if (voice.lang.includes(celebrity.lang.split('-')[0])) {
                    selectedVoice = voice;
                    break;
                }
            }
        }
        
        // If still no match, use first available voice
        if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
        }
        
        // Set voice if found
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        // Apply celebrity voice characteristics
        utterance.pitch = celebrity.pitch;
        utterance.rate = celebrity.rate;
        
        // Update slider values to match the celebrity settings
        pitch.value = celebrity.pitch;
        rate.value = celebrity.rate;
        pitchValue.textContent = `${celebrity.pitch}x`;
        rateValue.textContent = `${celebrity.rate}x`;
    }

    // Save to history with sparkle animation
    function saveToHistory(text) {
        // Truncate text for display
        const displayText = text.length > 50 ? text.substring(0, 50) + '...' : text;
        
        // Create history item with timestamp
        const historyItem = {
            id: Date.now(),
            text: text,
            displayText: displayText,
            timestamp: new Date().toLocaleString(),
            voice: voiceSelect.value,
            rate: rate.value,
            pitch: pitch.value
        };
        
        // Add to beginning of array (most recent first)
        speechHistory.unshift(historyItem);
        
        // Keep only last 10 items
        if (speechHistory.length > 10) {
            speechHistory = speechHistory.slice(0, 10);
        }
        
        // Save to local storage
        localStorage.setItem('speechHistory', JSON.stringify(speechHistory));
        
        // Update UI with animation
        renderHistory(true);
    }

    // Render history items with optional animation
    function renderHistory(animate = false) {
        historyList.innerHTML = '';
        
        if (speechHistory.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'No history yet. Convert some text to get started!';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.color = 'var(--light-text)';
            historyList.appendChild(emptyMsg);
            return;
        }
        
        speechHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.style.setProperty('--i', index); // For staggered animation
            
            if (animate && index === 0) {
                // Add special animation for newest item
                historyItem.style.animation = 'floating 1.5s ease infinite, glowPulse 2s infinite';
                historyItem.style.borderColor = 'var(--accent-color)';
            }
            
            const textSpan = document.createElement('span');
            textSpan.className = 'history-text';
            textSpan.textContent = item.displayText;
            textSpan.title = item.text;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-actions';
            
            const playBtn = document.createElement('button');
            playBtn.innerHTML = '<i class="fas fa-play play-icon"></i>';
            playBtn.title = 'Play this item';
            playBtn.addEventListener('click', () => {
                playSavedText(item);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash delete-icon"></i>';
            deleteBtn.title = 'Delete from history';
            deleteBtn.addEventListener('click', () => {
                deleteHistoryItem(item.id);
            });
            
            actionsDiv.appendChild(playBtn);
            actionsDiv.appendChild(deleteBtn);
            
            historyItem.appendChild(textSpan);
            historyItem.appendChild(actionsDiv);
            
            historyList.appendChild(historyItem);
        });
    }

    // Play text from history
    function playSavedText(item) {
        stopSpeaking();
        
        // Set UI to match saved settings
        voiceSelect.value = item.voice;
        rate.value = item.rate;
        pitch.value = item.pitch;
        rateValue.textContent = `${item.rate}x`;
        pitchValue.textContent = `${item.pitch}x`;
        textToConvert.value = item.text;
        charCount.textContent = item.text.length;
        
        // Add highlight animation to the text field
        textToConvert.style.borderColor = 'var(--accent-color)';
        textToConvert.style.boxShadow = 'var(--glow-effect)';
        
        setTimeout(() => {
            textToConvert.style.borderColor = '#333';
            textToConvert.style.boxShadow = 'none';
        }, 800);
        
        // Play the text
        const utterance = new SpeechSynthesisUtterance(item.text);
        
        // Apply voice settings
        applyCelebrityVoice(utterance);
        
        // Set up event listeners
        setupUtteranceEvents(utterance);
        
        // Speak
        currentUtterance = utterance;
        speechSynth.speak(utterance);
        
        // Update UI
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Speaking';
        convertBtn.appendChild(speakingAnimation.cloneNode(true));
    }

    // Delete history item with animation
    function deleteHistoryItem(id) {
        // Find the item in the DOM
        const items = document.querySelectorAll('.history-item');
        const index = speechHistory.findIndex(item => item.id === id);
        
        if (index !== -1 && items[index]) {
            // Apply delete animation
            items[index].style.transform = 'translateX(100%)';
            items[index].style.opacity = '0';
            
            setTimeout(() => {
                // Remove from data
                speechHistory = speechHistory.filter(item => item.id !== id);
                localStorage.setItem('speechHistory', JSON.stringify(speechHistory));
                
                // Update UI
                renderHistory();
            }, 300);
        } else {
            // Fallback if DOM element not found
            speechHistory = speechHistory.filter(item => item.id !== id);
            localStorage.setItem('speechHistory', JSON.stringify(speechHistory));
            renderHistory();
        }
    }

    // Set up utterance events
    function setupUtteranceEvents(utterance) {
        utterance.onend = () => {
            convertBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            currentUtterance = null;
            
            // Add completion animation
            convertBtn.classList.add('pulse-animation');
            setTimeout(() => {
                convertBtn.classList.remove('pulse-animation');
            }, 1000);
        };
        
        utterance.onerror = (event) => {
            errorMsg.textContent = `Error occurred: ${event.error}`;
            convertBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            currentUtterance = null;
        };
    }

    // Stop speaking with animation
    function stopSpeaking() {
        if (speechSynth.speaking) {
            speechSynth.cancel();
            convertBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            currentUtterance = null;
            
            // Add stop animation
            stopBtn.classList.add('pulse-animation');
            setTimeout(() => {
                stopBtn.classList.remove('pulse-animation');
            }, 500);
        }
    }

    // Convert button click handler with enhanced animations
    convertBtn.addEventListener('click', function() {
        const enteredText = textToConvert.value;
        
        // Check if already speaking - if so, stop
        if (speechSynth.speaking) {
            stopSpeaking();
            return;
        }
        
        // Validate input
        if (!enteredText.trim().length) {
            errorMsg.textContent = 'Please enter some text to convert to speech.';
            
            // Shake animation for error
            textToConvert.classList.add('shake-animation');
            setTimeout(() => {
                textToConvert.classList.remove('shake-animation');
            }, 500);
            
            return;
        }
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(enteredText);
        
        // Apply celebrity voice effects
        applyCelebrityVoice(utterance);
        
        // Set up events
        setupUtteranceEvents(utterance);
        
        // Save to history
        saveToHistory(enteredText);
        
        // Speak
        errorMsg.textContent = '';
        currentUtterance = utterance;
        speechSynth.speak(utterance);
        
        // Button pulse animation
        this.classList.add('pulse-animation');
        setTimeout(() => {
            this.classList.remove('pulse-animation');
        }, 500);
        
        // Update UI with animation
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Speaking';
        convertBtn.appendChild(speakingAnimation.cloneNode(true));
    });

    // Pause button handler with animation
    pauseBtn.addEventListener('click', function() {
        if (speechSynth.speaking && !speechSynth.paused) {
            speechSynth.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            
            // Add pause animation
            pauseBtn.classList.add('pulse-animation');
            setTimeout(() => {
                pauseBtn.classList.remove('pulse-animation');
            }, 500);
            
        } else if (speechSynth.paused) {
            speechSynth.resume();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            
            // Add resume animation
            pauseBtn.classList.add('pulse-animation');
            setTimeout(() => {
                pauseBtn.classList.remove('pulse-animation');
            }, 500);
        }
    });

    // Stop button handler
    stopBtn.addEventListener('click', stopSpeaking);

    // Download button handler with animation
    downloadBtn.addEventListener('click', function() {
        const text = textToConvert.value;
        
        if (!text.trim()) {
            errorMsg.textContent = 'Please enter text before downloading.';
            
            // Shake animation for error
            textToConvert.classList.add('shake-animation');
            setTimeout(() => {
                textToConvert.classList.remove('shake-animation');
            }, 500);
            
            return;
        }
        
        // Button animation
        this.classList.add('pulse-animation');
        setTimeout(() => {
            this.classList.remove('pulse-animation');
        }, 500);
        
        // Create a blob with the text
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary link and click it
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voice-wizard-text.txt';
        document.body.appendChild(a);
        a.click();
        
        // Flash success message
        errorMsg.style.color = 'var(--success-color)';
        errorMsg.textContent = 'Text downloaded successfully!';
        
        // Reset error message color after 2 seconds
        setTimeout(() => {
            errorMsg.style.color = 'var(--error-color)';
            errorMsg.textContent = '';
        }, 2000);
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });

    // Voice selection change handler with animation
    voiceSelect.addEventListener('change', function() {
        // Add selection animation
        this.style.borderColor = 'var(--accent-color)';
        this.style.boxShadow = 'var(--glow-effect)';
        
        setTimeout(() => {
            this.style.borderColor = '#333';
            this.style.boxShadow = 'none';
        }, 800);
        
        // If a celebrity voice is selected, update pitch and rate sliders
        if (this.value !== 'default') {
            const celebrityIndex = parseInt(this.value);
            const celebrity = celebrityVoices[celebrityIndex];
            
            // Animate the slider updates
            let currentPitch = parseFloat(pitch.value);
            let currentRate = parseFloat(rate.value);
            const targetPitch = celebrity.pitch;
            const targetRate = celebrity.rate;
            const steps = 10;
            const pitchStep = (targetPitch - currentPitch) / steps;
            const rateStep = (targetRate - currentRate) / steps;
            
            let stepCount = 0;
            const animation = setInterval(() => {
                currentPitch += pitchStep;
                currentRate += rateStep;
                
                pitch.value = currentPitch;
                rate.value = currentRate;
                pitchValue.textContent = `${currentPitch.toFixed(1)}x`;
                rateValue.textContent = `${currentRate.toFixed(1)}x`;
                
                stepCount++;
                if (stepCount >= steps) {
                    clearInterval(animation);
                    pitch.value = targetPitch;
                    rate.value = targetRate;
                    pitchValue.textContent = `${targetPitch}x`;
                    rateValue.textContent = `${targetRate}x`;
                }
            }, 30);
        }
    });

    // Load history on initial load
    renderHistory();
    
    // Add page load animations
    const elements = [
        { selector: '.app-container', delay: 0 },
        { selector: 'header', delay: 200 },
        { selector: '.text-section', delay: 400 },
        { selector: '.options-section', delay: 600 },
        { selector: '.buttons-container', delay: 800 },
        { selector: '.history-container', delay: 1000 }
    ];
    
    elements.forEach(element => {
        const el = document.querySelector(element.selector);
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, element.delay);
        }
    });
    
    // Add CSS for new animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes glowPulse {
            0% { box-shadow: 0 0 5px #ff0066, 0 0 10px #ff006680; }
            50% { box-shadow: 0 0 15px #ff0066, 0 0 25px #ff006680; }
            100% { box-shadow: 0 0 5px #ff0066, 0 0 10px #ff006680; }
        }
        
        @keyframes shake-animation {
            0% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
            100% { transform: translateX(0); }
        }
        
        .shake-animation {
            animation: shake-animation 0.5s ease;
        }
        
        @keyframes pulse-animation {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); box-shadow: 0 0 15px #ff0066, 0 0 30px #ff006680; }
            100% { transform: scale(1); }
        }
        
        .pulse-animation {
            animation: pulse-animation 0.5s ease;
        }
    `;
    document.head.appendChild(style);
});