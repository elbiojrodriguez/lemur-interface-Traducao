// ✅ SOLUÇÃO COMPLETA E CORRIGIDA
function initializeTranslator() {
 // ✅ CONFIGURAÇÃO CORRETA:
let IDIOMA_ORIGEM = window.callerLang || navigator.language || 'pt-BR'; // Idioma de QUEM FALA
const IDIOMA_DESTINO = window.targetTranslationLang || 'en'; // Idioma para TRADUZIR
const IDIOMA_FALA = window.targetTranslationLang || 'en-US'; // Idioma para FALAR
    
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
    
    // ===== FUNÇÃO PARA BUSCAR BANDEIRA DO JSON =====
    async function getBandeiraDoJson(langCode) {
        try {
            const response = await fetch('assets/bandeiras/language-flags.json');
            const flags = await response.json();
            
            // ⭐ TENTA: 1. Código completo → 2. Código base → 3. Fallback
            return flags[langCode] || flags[langCode.split('-')[0]] || '🎌';
        } catch (error) {
            console.error('Erro ao carregar bandeiras:', error);
            return '🎌';
        }
    }

    // ===== CONFIGURAÇÃO INICIAL =====
    getBandeiraDoJson(IDIOMA_ORIGEM).then(bandeira => {
        currentLanguageFlag.textContent = bandeira;
    });
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
    recognition.continuous = false; // ⭐ ALTERADO: continuous = false
    recognition.interimResults = true;
    
    // ===== VARIÁVEIS DE ESTADO =====
    let isRecording = false;
    let isTranslating = false; // ⭐ NOVO: controle de tradução
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let microphonePermissionGranted = false;
    let lastTranslationTime = 0; // ⭐ NOVO: debounce
    
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
            option.addEventListener('click', async function() {
                const novoIdioma = this.getAttribute('data-lang');
                IDIOMA_ORIGEM = novoIdioma;
                
                const bandeira = await getBandeiraDoJson(novoIdioma);
                currentLanguageFlag.textContent = bandeira;
                
                if (languageDropdown) {
                    languageDropdown.classList.remove('show');
                }
                
                if (isRecording && recognition) {
                    recognition.stop();
                }
                
                recognition = new SpeechRecognition();
                recognition.lang = novoIdioma;
                recognition.continuous = false; // ⭐ continuous = false
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
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            // ⭐ EXIBE TEXTO INTERIM (em tempo real)
            if (interimTranscript && !finalTranscript) {
                if (translatedText) {
                    translatedText.textContent = interimTranscript;
                }
            }
            
            // ⭐ PROCESSA TEXTO FINAL COM DEBOUNCE
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) { // ⭐ Debounce de 1s
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    if (translatedText) {
                        translatedText.textContent = "⏳";
                    }
                    
                    translateText(finalTranscript).then(translation => {
                        if (translatedText) {
                            translatedText.textContent = translation;
                            if (SpeechSynthesis) {
                                setTimeout(() => speakText(translation), 500);
                            }
                        }
                        isTranslating = false;
                    }).catch(error => {
                        console.error('Erro na tradução:', error);
                        if (translatedText) translatedText.textContent = "❌";
                        isTranslating = false;
                    });
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.log('Erro recognition:', event.error);
            if (event.error !== 'no-speech' && translatedText) {
                translatedText.textContent = "❌";
            }
            stopRecording();
        };
        
        recognition.onend = function() {
            if (isRecording) {
                stopRecording();
            }
        };
    }
    
    // ✅ SOLUÇÃO CORRIGIDA PARA PERMISSÃO
    async function requestMicrophonePermission() {
        // ⭐ PRIMEIRO: Verifica se já temos permissão SEM pedir de novo
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMicrophonePermission = devices.some(device => 
                device.kind === 'audioinput' && device.deviceId !== ''
            );
            
            if (hasMicrophonePermission) {
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                translatedText.textContent = "🎤";
                setupRecognitionEvents();
                return;
            }
            
            // ⭐ SEGUNDO: Se não tem permissão, pede UMA VEZ
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // ⭐ Para o stream após 1 segundo (apenas para verificação)
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
            }, 1000);
            
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            translatedText.textContent = "🎤";
            setupRecognitionEvents();
            
        } catch (error) {
            console.error('Erro permissão microfone:', error);
            translatedText.textContent = "🚫";
            recordButton.disabled = true;
        }
    }
    
    async function translateText(text) {
        try {
            // ⭐ LIMITA TAMANHO DO TEXTO (evita sobrecarga)
            const trimmedText = text.trim().slice(0, 500);
            if (!trimmedText) return "🎤";
            
            const response = await fetch('https://chat-tradutor.onrender.com/translate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Request-Source': 'web-translator'
                },
                body: JSON.stringify({ 
                    text: trimmedText, 
                    targetLang: IDIOMA_DESTINO,
                    source: 'integrated-translator',
                    sessionId: window.myId || 'default-session'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (speakerButton) speakerButton.disabled = false;
            return result.translatedText || "❌";
            
        } catch (error) {
            console.error('Erro na tradução:', error);
            return "❌";
        }
    }
    
    function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = IDIOMA_FALA;
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
        };
        
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        };
        
        utterance.onerror = function() {
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
        if (isRecording || isTranslating) return;
        
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
            console.error('Erro ao iniciar gravação:', error);
            if (translatedText) translatedText.textContent = "❌";
            stopRecording();
        }
    }
    
    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        if (recordButton) recordButton.classList.remove('recording');
        clearInterval(timerInterval);
        hideRecordingModal();
        
        if (translatedText && !isTranslating) {
            translatedText.textContent = "⏳";
        }
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
        
        // ⭐ PARA automaticamente após 30 segundos
        if (elapsedSeconds >= 30) {
            stopRecording();
        }
    }
    
    // ===== EVENTOS =====
    if (recordButton) {
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted || isTranslating) return;
            
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    tapMode = false;
                    startRecording();
                    showRecordingModal();
                }, 300);
            }
        });
        
        recordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
            
            if (isRecording) {
                stopRecording();
            } else {
                if (microphonePermissionGranted && !isTranslating) {
                    tapMode = true;
                    startRecording();
                    showRecordingModal();
                }
            }
        });
        
        // ⭐ SUPORTE PARA CLIQUE (mouse)
        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted || isTranslating) return;
            
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
                showRecordingModal();
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
