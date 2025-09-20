function initializeTranslator() {
    // ===== CONFIGURAÇÃO =====
    // ✅ ATUALIZAÇÃO 1: Busca idiomas do navegador e parâmetros URL
    let IDIOMA_ORIGEM = navigator.language || 'pt-BR';
    const urlParams = new URLSearchParams(window.location.search);
    const IDIOMA_DESTINO = urlParams.get('lang') || 'en';
    const IDIOMA_FALA = urlParams.get('lang') || 'en-US';
    
    // ===== ELEMENTOS DOM =====
    const recordButton = document.getElementById('recordButton');
    const translatedText = document.getElementById('translatedText');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    const worldButton = document.getElementById('worldButton');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // ⭐ VERIFICA SE ELEMENTOS CRÍTICOS EXISTEM
    if (!currentLanguageFlag || !recordButton || !translatedText || !languageDropdown) {
        console.log('Aguardando elementos do DOM...');
        setTimeout(initializeTranslator, 300);
        return;
    }
    
    // ===== CONFIGURAÇÃO INICIAL =====
    // ✅ ATUALIZAÇÃO 3: Usa bandeira já existente na página
    const localLangElement = document.querySelector('.local-Lang');
    currentLanguageFlag.textContent = localLangElement?.textContent || '🎌';
    translatedText.textContent = "🎤";
    
    // ===== VERIFICAÇÃO DE SUPORTE =====
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        translatedText.textContent = "❌";
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        speakerButton.style.display = 'none';
    }
    
    let recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // ===== VARIÁVEIS DE ESTADO =====
    let isRecording = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let microphonePermissionGranted = false;
    
    // ===== FUNÇÕES DE IDIOMA =====
    if (worldButton && languageDropdown) {
        worldButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });
    }
    
    document.addEventListener('click', function(e) {
        if (languageDropdown && !languageDropdown.contains(e.target) && e.target !== worldButton) {
            languageDropdown.classList.remove('show');
        }
    });
    
    if (languageOptions && languageOptions.length > 0) {
        languageOptions.forEach(option => {
            option.addEventListener('click', function() {
                const novoIdioma = this.getAttribute('data-lang');
                IDIOMA_ORIGEM = novoIdioma;
                
                // ✅ ATUALIZAÇÃO 3: Busca bandeira do elemento existente
                const bandeiraElement = document.querySelector('.local-Lang');
                if (currentLanguageFlag) {
                    currentLanguageFlag.textContent = bandeiraElement ? bandeiraElement.textContent : '🎌';
                }
                
                if (languageDropdown) {
                    languageDropdown.classList.remove('show');
                }
                
                if (isRecording && recognition) {
                    recognition.stop();
                }
                
                recognition = new SpeechRecognition();
                recognition.lang = novoIdioma;
                recognition.continuous = true;
                recognition.interimResults = true;
                setupRecognitionEvents();
                
                if (translatedText) {
                    translatedText.textContent = "✅";
                    setTimeout(() => {
                        if (translatedText) translatedText.textContent = "🎤";
                    }, 1000);
                }
            });
        });
    }
    
    // ===== FUNÇÕES PRINCIPAIS =====
    function setupRecognitionEvents() {
        recognition.onresult = function(event) {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript && translatedText) {
                translatedText.textContent = "⏳";
                translateText(finalTranscript).then(translation => {
                    if (translatedText) {
                        translatedText.textContent = translation;
                        if (SpeechSynthesis) {
                            setTimeout(() => speakText(translation), 500);
                        }
                    }
                });
            }
        };
        
        recognition.onerror = function(event) {
            if (event.error !== 'no-speech' && translatedText) {
                translatedText.textContent = "❌";
            }
            stopRecording();
        };
        
        recognition.onend = stopRecording;
    }
    
    // ✅ ATUALIZAÇÃO 2: Compartilha permissão já concedida
    async function requestMicrophonePermission() {
        // ⭐ PRIMEIRO: Tenta usar permissão já concedida pelos outros scripts
        try {
            // Verifica se já temos permissão
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // ⭐ IMPORTANTE: NÃO PARA O STREAM! Apenas verifica a permissão
            microphonePermissionGranted = true;
            if (recordButton) recordButton.disabled = false;
            if (translatedText) translatedText.textContent = "🎤";
            setupRecognitionEvents();
            return;
            
        } catch (error) {
            // ⭐ SEGUNDO: Se não tem permissão, pede só para áudio
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                microphonePermissionGranted = true;
                if (recordButton) recordButton.disabled = false;
                if (translatedText) translatedText.textContent = "🎤";
                setupRecognitionEvents();
            } catch (error) {
                if (translatedText) translatedText.textContent = "🚫";
                if (recordButton) recordButton.disabled = true;
            }
        }
    }
    
    async function translateText(text) {
        try {
            const response = await fetch('https://chat-tradutor.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang: IDIOMA_DESTINO })
            });
            const result = await response.json();
            if (speakerButton) speakerButton.disabled = false;
            return result.translatedText || "❌";
        } catch (error) {
            return "❌";
        }
    }
    
    function speakText(text) {
        if (!SpeechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = IDIOMA_FALA;
        utterance.rate = 0.9;
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
        };
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        };
        window.speechSynthesis.speak(utterance);
    }
    
    function toggleSpeech() {
        if (!SpeechSynthesis) return;
        if (isSpeechPlaying) {
            window.speechSynthesis.cancel();
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        } else {
            if (translatedText) {
                const textToSpeak = translatedText.textContent;
                if (textToSpeak && textToSpeak !== "🎤" && textToSpeak !== "⏳" && textToSpeak !== "❌") {
                    speakText(textToSpeak);
                }
            }
        }
    }
    
    function startRecording() {
        try {
            recognition.start();
            isRecording = true;
            if (recordButton) recordButton.classList.add('recording');
            recordingStartTime = Date.now();
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
            if (translatedText) translatedText.textContent = "🎙️";
            if (speakerButton) {
                speakerButton.disabled = true;
                speakerButton.textContent = '🔇';
            }
        } catch (error) {
            if (translatedText) translatedText.textContent = "❌";
        }
    }
    
    function stopRecording() {
        if (!isRecording) return;
        recognition.stop();
        isRecording = false;
        if (recordButton) recordButton.classList.remove('recording');
        clearInterval(timerInterval);
        hideRecordingModal();
        if (translatedText) translatedText.textContent = "⏳";
    }
    
    function showRecordingModal() {
        if (recordingModal) recordingModal.classList.add('visible');
    }
    
    function hideRecordingModal() {
        if (recordingModal) recordingModal.classList.remove('visible');
    }
    
    function updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        if (recordingTimer) {
            recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // ===== EVENTOS =====
    if (recordButton) {
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted) return;
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    tapMode = false;
                    startRecording();
                }, 300);
            }
        });
        
        recordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
            if (isRecording) {
                stopRecording();
            } else {
                if (microphonePermissionGranted) {
                    tapMode = true;
                    startRecording();
                    showRecordingModal();
                }
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', stopRecording);
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', toggleSpeech);
    }
    
    // ===== INICIALIZAÇÃO =====
    requestMicrophonePermission();
    
    console.log('Tradutor inicializado com sucesso!');
    console.log('Configuração:', {
        IDIOMA_ORIGEM,
        IDIOMA_DESTINO,
        IDIOMA_FALA
    });
}

// Inicializa com delay para garantir que tudo esteja carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando tradutor...');
    setTimeout(initializeTranslator, 800);
});
