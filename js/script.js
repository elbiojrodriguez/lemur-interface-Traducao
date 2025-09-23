// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto, audioData = null) {
    if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
        const mensagem = audioData 
            ? JSON.stringify({ texto, audioData }) // ✅ Mudei para audioData (base64)
            : texto;
        window.rtcDataChannel.send(mensagem);
        console.log('✅ Pacote enviado:', texto.substring(0, 30) + '...');
    } else {
        console.log('⏳ Canal não disponível...');
        setTimeout(() => enviarParaOutroCelular(texto, audioData), 1000);
    }
}

// ===== NOVA FUNÇÃO: PROCESSAMENTO COMPLETO NO SERVIDOR =====
async function processarFalaCompleta(textoFalado, idiomaOrigem, idiomaDestino) {
    try {
        console.log('🎯 Enviando para servidor:', { 
            origem: idiomaOrigem, 
            destino: idiomaDestino,
            texto: textoFalado.substring(0, 50) + '...'
        });

        const response = await fetch('https://chat-tradutor.onrender.com/translate-and-speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: textoFalado, // ✅ Texto BRUTO (não traduzido)
                sourceLang: idiomaOrigem, // ✅ Idioma original
                targetLang: idiomaDestino // ✅ Idioma destino
            })
        });

        if (!response.ok) throw new Error('Erro no servidor');

        const resultado = await response.json();
        
        if (resultado.success) {
            console.log('✅ Pacote recebido do servidor:', {
                textoTraduzido: resultado.translatedText.substring(0, 30) + '...',
                audioTamanho: resultado.audioData ? resultado.audioData.length + ' bytes' : 'nulo'
            });
            
            return {
                textoTraduzido: resultado.translatedText,
                audioData: resultado.audioData // ✅ Já vem em base64
            };
        } else {
            throw new Error(resultado.error || 'Erro no processamento');
        }
        
    } catch (error) {
        console.error('❌ Erro no processamento completo:', error);
        // Fallback: retorna apenas o texto original
        return { textoTraduzido: textoFalado, audioData: null };
    }
}

// ===== FUNÇÃO DE TRADUÇÃO (MANTIDA PARA COMPATIBILIDADE) =====
async function translateText(text) {
    try {
        const response = await fetch('https://chat-tradutor.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                sourceLang: window.sourceTranslationLang || 'auto',
                targetLang: window.targetTranslationLang || 'en'
            })
        });
        const result = await response.json();
        return result.translatedText || text;
    } catch (error) {
        return text;
    }
}

// ===== INICIALIZAÇÃO DO BOTÃO MUNDO (INDEPENDENTE) =====
function initializeWorldButton() {
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    const worldButton = document.getElementById('worldButton');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    if (!worldButton || !languageDropdown || !currentLanguageFlag) {
        console.log('⏳ Aguardando elementos do botão mundo...');
        setTimeout(initializeWorldButton, 300);
        return;
    }
    
    console.log('🎯 Inicializando botão mundo...');
    
    let IDIOMA_ORIGEM = window.callerLang || navigator.language || 'pt-BR';
    
    async function getBandeiraDoJson(langCode) {
        try {
            const response = await fetch('assets/bandeiras/language-flags.json');
            const flags = await response.json();
            return flags[langCode] || flags[langCode.split('-')[0]] || '🎌';
        } catch (error) {
            console.error('Erro ao carregar bandeiras:', error);
            return '🎌';
        }
    }
    
    getBandeiraDoJson(IDIOMA_ORIGEM).then(bandeira => {
        currentLanguageFlag.textContent = bandeira;
    });

    worldButton.addEventListener('click', function(e) {
        console.log('🎯 Botão Mundo clicado!');
        e.preventDefault();
        e.stopPropagation();
        languageDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        if (!languageDropdown.contains(e.target) && e.target !== worldButton) {
            languageDropdown.classList.remove('show');
        }
    });

    languageOptions.forEach(option => {
        option.addEventListener('click', async function() {
            const novoIdioma = this.getAttribute('data-lang');
            IDIOMA_ORIGEM = novoIdioma;
            
            const bandeira = await getBandeiraDoJson(novoIdioma);
            currentLanguageFlag.textContent = bandeira;
            languageDropdown.classList.remove('show');
            
            window.currentSourceLang = novoIdioma;
            
            const translatedText = document.getElementById('translatedText');
            if (translatedText) {
                translatedText.textContent = "✅";
                setTimeout(() => {
                    if (translatedText) translatedText.textContent = "🎤";
                }, 1000);
            }
            
            console.log('🌎 Idioma alterado para:', novoIdioma);
        });
    });
    
    console.log('✅ Botão mundo inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO DO TRADUTOR (AGORA COM FLUXO COMPLETO) =====
function initializeTranslator() {
    let IDIOMA_ORIGEM = navigator.language || 'pt-BR';
    const urlParams = new URLSearchParams(window.location.search);
    const IDIOMA_DESTINO = urlParams.get('lang') || 'en';
    
    console.log('🎯 Configuração de tradução:', {
        origem: IDIOMA_ORIGEM,
        destino: IDIOMA_DESTINO
    });

    const recordButton = document.getElementById('recordButton');
    const translatedText = document.getElementById('translatedText');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    
    // ⭐ VERIFICA SE ELEMENTOS CRÍTICOS EXISTEM
    if (!currentLanguageFlag || !recordButton || !translatedText) {
        console.log('Aguardando elementos do DOM...');
        setTimeout(initializeTranslator, 300);
        return;
    }

    // ⭐ REMOVIDO: Não precisa mais do TTS do navegador
    if (speakerButton) speakerButton.style.display = 'none';
    
    translatedText.textContent = "🎤";
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        translatedText.textContent = "❌";
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    let recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = true;
    
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let microphonePermissionGranted = false;
    let lastTranslationTime = 0;
    
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

            if (interimTranscript && !finalTranscript && translatedText) {
                translatedText.textContent = interimTranscript;
            }

            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    if (translatedText) translatedText.textContent = "⏳";
                    
                    // ✅✅✅ NOVO FLUXO: Envia texto BRUTO para servidor fazer TUDO
                    processarFalaCompleta(finalTranscript, IDIOMA_ORIGEM, IDIOMA_DESTINO)
                        .then(resultado => {
                            if (translatedText) {
                                translatedText.textContent = resultado.textoTraduzido;
                                
                                if (finalTranscript.length > 5) {
                                    // ✅ Envia ambos (texto traduzido + áudio base64)
                                    enviarParaOutroCelular(resultado.textoTraduzido, resultado.audioData);
                                }
                            }
                            isTranslating = false;
                        })
                        .catch(error => {
                            console.error('Erro no processamento:', error);
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
            if (isRecording) stopRecording();
        };
    }

    async function requestMicrophonePermission() {
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

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
            });
            
            setTimeout(() => stream.getTracks().forEach(track => track.stop()), 1000);
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
        if (translatedText && !isTranslating) translatedText.textContent = "⏳";
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
        if (recordingTimer) recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (elapsedSeconds >= 30) stopRecording();
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
            if (isRecording) stopRecording();
            else if (microphonePermissionGranted && !isTranslating) {
                tapMode = true;
                startRecording();
                showRecordingModal();
            }
        });
        
        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted || isTranslating) return;
            if (isRecording) stopRecording();
            else { startRecording(); showRecordingModal(); }
        });
    }
    
    if (sendButton) sendButton.addEventListener('click', stopRecording);
    
    requestMicrophonePermission();
    console.log('✅ Tradutor com fluxo completo inicializado!');
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando aplicação...');
    initializeWorldButton(); // ⭐ INDEPENDENTE - SEMPRE FUNCIONA
    setTimeout(initializeTranslator, 500);
});
