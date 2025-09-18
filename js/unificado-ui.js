// 🔓 Gatilho inicial para pedir câmera e microfone
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error("Permissões negadas:", error);
  });

// ===================
// 📦 Script 1: WebRTC com câmera
// ===================
import WebRTCCore from '../core/webrtc-core.js';

window.onload = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera e microfone:", error);
  }

  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  document.getElementById('myId').textContent = myId;

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  const urlParams = new URLSearchParams(window.location.search);
  const receiverId = urlParams.get('targetId') || '';
  const receiverToken = urlParams.get('token') || '';
  const receiverLang = urlParams.get('lang') || 'pt-BR';

  // 🎯 ARMAZENAR IDIOMAS NO LOCALSTORAGE
  localStorage.setItem('userLanguage', navigator.language || 'pt-BR');
  localStorage.setItem('receiverLanguage', receiverLang || 'en');

  window.receiverInfo = {
    id: receiverId,
    token: receiverToken,
    lang: receiverLang
  };

  if (receiverId) {
    document.getElementById('callActionBtn').style.display = 'block';
    document.getElementById('callActionBtn').onclick = () => {
      if (localStream) {
        const callerLang = navigator.language || 'pt-BR';
        rtcCore.startCall(receiverId, localStream, callerLang);
      }
    };
  }

  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = stream;
  });

  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';
  const navegadorLang = navigator.language || 'pt-BR';

  const frasesParaTraduzir = {
    "translator-label": "Live translation. No filters. No platform."
  };

  async function translateText(text, targetLang) {
    try {
      const response = await fetch(TRANSLATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });

      const result = await response.json();
      return result.translatedText || text;
    } catch (error) {
      console.error('Erro na tradução:', error);
      return text;
    }
  }

  (async () => {
    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, navegadorLang);
        el.textContent = traduzido;
      }
    }
  })();

  async function aplicarBandeiraLocal(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

      const localLangElement = document.querySelector('.local-mic-Lang');
      if (localLangElement) {
        localLangElement.textContent = bandeira;
      }

      const localLangDisplay = document.querySelector('.local-Lang');
      if (localLangDisplay) {
        localLangDisplay.textContent = bandeira;
      }
    } catch (error) {
      console.error('Erro ao carregar bandeira local:', error);
    }
  }

  async function aplicarBandeiraRemota(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

      const remoteLangElement = document.querySelector('.remoter-Lang');
      if (remoteLangElement) {
        remoteLangElement.textContent = bandeira;
      }
    } catch (error) {
      console.error('Erro ao carregar bandeira remota:', error);
      const remoteLangElement = document.querySelector('.remoter-Lang');
      if (remoteLangElement) {
        remoteLangElement.textContent = '🔴';
      }
    }
  }

  aplicarBandeiraLocal(navegadorLang);
  aplicarBandeiraRemota(receiverLang);
};

// ===================
// 🎤 Script 2: Reconhecimento de voz (ATUALIZADO)
// ===================

document.addEventListener('DOMContentLoaded', function() {
    // ===== CONFIGURAÇÃO DINÂMICA =====
    let IDIOMA_ORIGEM = localStorage.getItem('userLanguage') || navigator.language || 'pt-BR';
    let IDIOMA_DESTINO = (localStorage.getItem('receiverLanguage') || 'en').split('-')[0];
    let IDIOMA_FALA = localStorage.getItem('receiverLanguage') || 'en-US';
    
    console.log('🔊 Configuração de Idiomas:', {
        origem: IDIOMA_ORIGEM,
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA
    });
    
    const BANDEIRAS_IDIOMAS = {
        'pt-BR': '🇧🇷', 'pt': '🇧🇷', 'en-US': '🇺🇸', 'en': '🇺🇸', 'es': '🇪🇸', 
        'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'ja': '🇯🇵', 'ru': '🇷🇺',
        'zh': '🇨🇳', 'ar': '🇸🇦', 'hi': '🇮🇳', 'ko': '🇰🇷'
    };
    
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
    
    // ===== CONFIGURAÇÃO INICIAL =====
    currentLanguageFlag.textContent = BANDEIRAS_IDIOMAS[IDIOMA_ORIGEM] || '🌐';
    translatedText.textContent = `${BANDEIRAS_IDIOMAS[IDIOMA_ORIGEM] || '🎤'}→${BANDEIRAS_IDIOMAS[IDIOMA_DESTINO] || '🌐'}`;
    
    // ===== VERIFICAÇÃO DE SUPORTE =====
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        translatedText.textContent = "❌ Navegador não suporta reconhecimento de voz";
        recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis) {
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
    worldButton.addEventListener('click', function(e) {
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
        option.addEventListener('click', function() {
            const novoIdioma = this.getAttribute('data-lang');
            IDIOMA_ORIGEM = novoIdioma;
            currentLanguageFlag.textContent = BANDEIRAS_IDIOMAS[novoIdioma] || '🌐';
            translatedText.textContent = `${BANDEIRAS_IDIOMAS[novoIdioma] || '🎤'}→${BANDEIRAS_IDIOMAS[IDIOMA_DESTINO] || '🌐'}`;
            languageDropdown.classList.remove('show');
            
            if (isRecording) recognition.stop();
            
            recognition = new SpeechRecognition();
            recognition.lang = novoIdioma;
            recognition.continuous = true;
            recognition.interimResults = true;
            setupRecognitionEvents();
            
            translatedText.textContent = "✅";
            setTimeout(() => {
                translatedText.textContent = `${BANDEIRAS_IDIOMAS[novoIdioma] || '🎤'}→${BANDEIRAS_IDIOMAS[IDIOMA_DESTINO] || '🌐'}`;
            }, 1000);
        });
    });
    
    // ===== FUNÇÕES PRINCIPAIS =====
    function setupRecognitionEvents() {
        recognition.onresult = function(event) {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                translatedText.textContent = "⏳";
                translateText(finalTranscript).then(translation => {
                    translatedText.textContent = translation;
                    if (SpeechSynthesis) {
                        setTimeout(() => speakText(translation), 500);
                    }
                });
            }
        };
        
        recognition.onerror = function(event) {
            if (event.error !== 'no-speech') {
                translatedText.textContent = "❌ Erro no reconhecimento";
            }
            stopRecording();
        };
        
        recognition.onend = stopRecording;
    }
    
    async function requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            translatedText.textContent = `${BANDEIRAS_IDIOMAS[IDIOMA_ORIGEM] || '🎤'}→${BANDEIRAS_IDIOMAS[IDIOMA_DESTINO] || '🌐'}`;
            setupRecognitionEvents();
        } catch (error) {
            translatedText.textContent = "🚫 Microfone bloqueado";
            recordButton.disabled = true;
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
            speakerButton.disabled = false;
            return result.translatedText || "❌ Erro na tradução";
        } catch (error) {
            return "❌ Erro de conexão";
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
            speakerButton.textContent = '⏹';
        };
        utterance.onend = function() {
            isSpeechPlaying = false;
            speakerButton.textContent = '🔊';
        };
        window.speechSynthesis.speak(utterance);
    }
    
    function toggleSpeech() {
        if (!SpeechSynthesis) return;
        if (isSpeechPlaying) {
            window.speechSynthesis.cancel();
            isSpeechPlaying = false;
            speakerButton.textContent = '🔊';
        } else {
            const textToSpeak = translatedText.textContent;
            if (textToSpeak && textToSpeak !== "🎤" && textToSpeak !== "⏳" && textToSpeak !== "❌") {
                speakText(textToSpeak);
            }
        }
    }
    
    function startRecording() {
        try {
            recognition.start();
            isRecording = true;
            recordButton.classList.add('recording');
            recordingStartTime = Date.now();
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
            translatedText.textContent = "🎤 Gravando...";
            speakerButton.disabled = true;
            speakerButton.textContent = '🔇';
        } catch (error) {
            translatedText.textContent = "❌ Erro ao gravar";
        }
    }
    
    function stopRecording() {
        if (!isRecording) return;
        recognition.stop();
        isRecording = false;
        recordButton.classList.remove('recording');
        clearInterval(timerInterval);
        hideRecordingModal();
        translatedText.textContent = "⏳ Processando...";
    }
    
    function showRecordingModal() {
        recordingModal.classList.add('visible');
    }
    
    function hideRecordingModal() {
        recordingModal.classList.remove('visible');
    }
    
    function updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // ===== EVENTOS =====
    recordButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (recordButton.disabled || !microphonePermissionGranted) return;
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
            if (microphonePermissionGranted) {
                tapMode = true;
                startRecording();
                showRecordingModal();
            }
        }
    });
    
    sendButton.addEventListener('click', stopRecording);
    speakerButton.addEventListener('click', toggleSpeech);
    
    // ===== INICIALIZAÇÃO =====
    requestMicrophonePermission();
});
