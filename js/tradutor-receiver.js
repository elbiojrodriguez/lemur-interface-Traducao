// ✅ SOLUÇÃO COMPLETA E CORRIGIDA

// ✅ INICIALIZAÇÃO AUTOMÁTICA DO TRADUTOR
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeTranslator, 800);
});

// ✅ FUNÇÃO PRINCIPAL DO TRADUTOR
function initializeTranslator() {
 // 🔤 DEFINIÇÃO DOS IDIOMAS
    let IDIOMA_ORIGEM = window.callerLang || navigator.language || 'pt-BR';
    const IDIOMA_DESTINO = window.targetTranslationLang || new URLSearchParams(window.location.search).get('lang') || 'en';
    const IDIOMA_FALA = getIdiomaFala(IDIOMA_DESTINO);
    
   // 🎯 ELEMENTOS DO DOM
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
    
    // 🛑 VERIFICA SE ELEMENTOS CRÍTICOS EXISTEM
    if (!currentLanguageFlag || !recordButton || !translatedText || !languageDropdown) {
        console.log('Aguardando elementos do DOM...');
        setTimeout(initializeTranslator, 300);
        return;
    }
    
    // 📤 FUNÇÃO: ENVIA TEXTO VIA WEBRTC
    function enviarParaOutroCelular(texto) {
        if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
            window.rtcDataChannel.send(texto);
            console.log('✅ Texto enviado:', texto);
        } else {
            console.log('⏳ Canal não disponível ainda. Tentando novamente...');
            // Tenta novamente após 1 segundo (recursão)
            setTimeout(() => enviarParaOutroCelular(texto), 1000);
        }
    }

    // 🏳️ FUNÇÃO: BUSCA BANDEIRA DO JSON
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

     // 🏁 CONFIGURAÇÃO INICIAL DA INTERFACE
    getBandeiraDoJson(IDIOMA_ORIGEM).then(bandeira => {
        currentLanguageFlag.textContent = bandeira;
    });
    translatedText.textContent = "🎤";
    
   // 🧠 VERIFICA SUPORTE DO NAVEGADOR
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
    
    // 🎙️ INSTANCIA O RECONHECIMENTO DE VOZ
    let recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = true;
    
    // 🧩 VARIÁVEIS DE ESTADO
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let microphonePermissionGranted = false;
    let lastTranslationTime = 0;
    
      
    // 🌐 CONFIGURA BOTÃO DE IDIOMA
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
                              
                 languageDropdown.classList.remove('show');
                              
                if (isRecording && recognition) recognition.stop();                              
                recognition = new SpeechRecognition();

                recognition.lang = novoIdioma;
                recognition.continuous = false;
                recognition.interimResults = true;
                setupRecognitionEvents();
                
                translatedText.textContent = "✅";
                setTimeout(() => translatedText.textContent = "🎤", 1000);
         });
    });
  }
    
   // 📡 FUNÇÃO: CONFIGURA EVENTOS DE RECONHECIMENTO
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
               translatedText.textContent = interimTranscript;
             }

            // ⭐ PROCESSA TEXTO FINAL COM DEBOUNCE
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    translatedText.textContent = "⏳";                                 
                    translateText(finalTranscript).then(translation => {
                        
                            translatedText.textContent = translation;
                            enviarParaOutroCelular(translation);
                 
                        isTranslating = false;
                    }).catch(error => {
                        console.error('Erro na tradução:', error);
                        translatedText.textContent = "❌";
                        isTranslating = false;
                    });
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.log('Erro recognition:', event.error);

            if (event.error !== 'no-speech') translatedText.textContent = "❌";
            stopRecording();
         };
        
        recognition.onend = function() {
            if (isRecording) stopRecording();
          };
       }

   // 🎧 FUNÇÃO: SOLICITA PERMISSÃO DO MICROFONE
    async function requestMicrophonePermission() {
    // ⭐ PRIMEIRO: Verifica se já temos permissão SEM pedir de novo
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const hasMicrophonePermission = devices.some(device => 
                device.kind === 'audioinput' && device.deviceId !== '');
            
            if (hasMicrophonePermission) {
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                translatedText.textContent = "🎤";
                setupRecognitionEvents();
                return;
            }

             // ⭐ SEGUNDO: Se não tem permissão, pede UMA VEZ
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
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

     // 🌍 FUNÇÃO: TRADUZ TEXTO
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
            
                     
            const result = await response.json();
            if (speakerButton) speakerButton.disabled = false;
            
            return result.translatedText || "❌";
            
        } catch (error) {
            console.error('Erro na tradução:', error);
            return "❌";
        }
    }

    // 🔊 FUNÇÃO: FALAR TEXTO TRADUZIDO
    function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = IDIOMA_FALA;
        utterance.rate = 0.9;
        utterance.volume = 0.8;
              
        window.speechSynthesis.speak(utterance);
    });
  }
    
     // 🎛️ FUNÇÃO: CONFIGURA BOTÃO DE GRAVAÇÃO
  if (recordButton) {
    recordButton.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        tapMode = false;
        startRecording();
      }, 300);
    });

    recordButton.addEventListener('mouseup', () => {
      clearTimeout(pressTimer);
      if (!tapMode) {
        stopRecording();
      }
    });

    recordButton.addEventListener('click', () => {
      tapMode = true;
      if (!isRecording) {
        startRecording();
      } else {
        stopRecording();
      }
    });
  }

  // 🕒 FUNÇÃO: INICIA GRAVAÇÃO
  function startRecording() {
    if (!microphonePermissionGranted || isRecording) return;
    isRecording = true;
    translatedText.textContent = "🎙️";
    if (recordingModal) recordingModal.style.display = 'block';
    recordingStartTime = Date.now();
    if (recordingTimer) {
      recordingTimer.textContent = "00:00";
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        recordingTimer.textContent = `${minutes}:${seconds}`;
      }, 1000);
    }
    recognition.start();
  }

  // 🛑 FUNÇÃO: PARA GRAVAÇÃO
  function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    translatedText.textContent = "🎤";
    if (recordingModal) recordingModal.style.display = 'none';
    if (timerInterval) clearInterval(timerInterval);
    if (recognition) recognition.stop();
  }

  // 📤 FUNÇÃO: CONFIGURA BOTÃO DE ENVIO
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const texto = translatedText.textContent;
      if (texto && texto !== "🎤" && texto !== "⏳" && texto !== "❌") {
        enviarParaOutroCelular(texto);
      }
    });
  }

  // 🎧 INICIA VERIFICAÇÃO DE PERMISSÃO DO MICROFONE
  requestMicrophonePermission();
}
});
