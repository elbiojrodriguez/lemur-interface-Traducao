import { obterIdiomaCompleto } from './utils/idioma-utils.js';

document.addEventListener('DOMContentLoaded', async function() {
  const params = new URLSearchParams(window.location.search);

  // Configuração de idiomas
  let IDIOMA_ORIGEM = await obterIdiomaCompleto(params.get('lang') || navigator.language || 'pt-BR');
  let IDIOMA_DESTINO = 'en-US';
  let IDIOMA_FALA = IDIOMA_DESTINO;

  // Callback para chamadas WebRTC
  window.rtcCore.onIncomingCall = async (offer, idiomaDoCaller) => {
    IDIOMA_DESTINO = await obterIdiomaCompleto(idiomaDoCaller || 'en-US');
    IDIOMA_FALA = IDIOMA_DESTINO;
  };

  // Função de tradução centralizada
  async function translateText(text) {
    try {
      const response = await fetch('https://chat-tradutor.onrender.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text,
          sourceLang: IDIOMA_ORIGEM,
          targetLang: IDIOMA_DESTINO
        })
      });
      const result = await response.json();
      return result.translatedText || text;
    } catch (error) {
      return text;
    }
  }

  // Elementos da UI
  const elements = {
    recordButton: document.getElementById('recordButton'),
    translatedText: document.getElementById('translatedText'),
    recordingModal: document.getElementById('recordingModal'),
    recordingTimer: document.getElementById('recordingTimer'),
    speakerButton: document.getElementById('speakerButton'),
    currentLanguageFlag: document.getElementById('currentLanguageFlag'),
    worldButton: document.getElementById('worldButton'),
    languageDropdown: document.getElementById('languageDropdown'),
    languageOptions: document.querySelectorAll('.language-option')
  };

  // Verificação de suporte a APIs
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechSynthesis = window.speechSynthesis;

  if (!SpeechRecognition || !elements.recordButton || !elements.translatedText) {
    console.error('APIs ou elementos não suportados');
    return;
  }

  // Estado da aplicação
  const state = {
    isRecording: false,
    isTranslating: false,
    isSpeechPlaying: false,
    microphonePermissionGranted: false,
    lastTranslationTime: 0
  };

  let recognition = new SpeechRecognition();
  let timerInterval = null;
  let recordingStartTime = 0;

  // Configuração do reconhecimento de voz
  function setupRecognition() {
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = function(event) {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else if (elements.translatedText) {
          elements.translatedText.textContent = event.results[i][0].transcript;
        }
      }

      if (finalTranscript && !state.isTranslating) {
        processTranslation(finalTranscript);
      }
    };

    recognition.onerror = function(event) {
      if (event.error !== 'no-speech' && elements.translatedText) {
        elements.translatedText.textContent = "❌";
      }
      stopRecording();
    };

    recognition.onend = function() {
      if (state.isRecording) stopRecording();
    };
  }

  // Processamento da tradução
  async function processTranslation(text) {
    const now = Date.now();
    if (now - state.lastTranslationTime < 1000) return;
    
    state.lastTranslationTime = now;
    state.isTranslating = true;

    if (elements.translatedText) elements.translatedText.textContent = "⏳";

    try {
      const translation = await translateText(text);
      if (elements.translatedText) {
        elements.translatedText.textContent = translation;
        if (SpeechSynthesis) speakText(translation);
      }
    } catch (error) {
      if (elements.translatedText) elements.translatedText.textContent = "❌";
    } finally {
      state.isTranslating = false;
    }
  }

  // Síntese de voz
  function speakText(text) {
    if (!SpeechSynthesis || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = IDIOMA_FALA;
    utterance.rate = 0.9;

    utterance.onstart = () => {
      state.isSpeechPlaying = true;
      if (elements.speakerButton) elements.speakerButton.textContent = '⏹';
    };

    utterance.onend = utterance.onerror = () => {
      state.isSpeechPlaying = false;
      if (elements.speakerButton) elements.speakerButton.textContent = '🔊';
    };

    window.speechSynthesis.speak(utterance);
  }

  // Controle de gravação
  function startRecording() {
    if (state.isRecording || state.isTranslating) return;

    try {
      recognition.start();
      state.isRecording = true;
      
      if (elements.recordButton) elements.recordButton.classList.add('recording');
      recordingStartTime = Date.now();
      startTimer();
      
      if (elements.translatedText) elements.translatedText.textContent = "🎙️";
      if (elements.speakerButton) elements.speakerButton.disabled = true;

    } catch (error) {
      if (elements.translatedText) elements.translatedText.textContent = "❌";
      stopRecording();
    }
  }

  function stopRecording() {
    if (!state.isRecording) return;

    state.isRecording = false;
    recognition.stop();
    
    if (elements.recordButton) elements.recordButton.classList.remove('recording');
    clearInterval(timerInterval);
    if (elements.recordingModal) elements.recordingModal.classList.remove('visible');
    
    if (elements.translatedText && !state.isTranslating) {
      elements.translatedText.textContent = "⏳";
    }
  }

  // Timer de gravação
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
      
      if (elements.recordingTimer) {
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        elements.recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      if (elapsedSeconds >= 30) stopRecording();
    }, 1000);
  }

  // Gerenciamento de permissões
  async function setupMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      stream.getTracks().forEach(track => track.stop());
      state.microphonePermissionGranted = true;
      if (elements.recordButton) elements.recordButton.disabled = false;
      if (elements.translatedText) elements.translatedText.textContent = "🎤";
      
      setupRecognition();
    } catch (error) {
      if (elements.translatedText) elements.translatedText.textContent = "🚫";
      if (elements.recordButton) elements.recordButton.disabled = true;
    }
  }

  // Event listeners
  function setupEventListeners() {
    // Botão de gravação
    if (elements.recordButton) {
      elements.recordButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.isRecording) stopRecording();
        else startRecording();
      });
    }

    // Botão de áudio
    if (elements.speakerButton) {
      elements.speakerButton.addEventListener('click', () => {
        if (state.isSpeechPlaying) {
          window.speechSynthesis.cancel();
        } else if (elements.translatedText) {
          const text = elements.translatedText.textContent;
          if (text && !["🎤", "⏳", "❌"].includes(text)) {
            speakText(text);
          }
        }
      });
    }

    // Seletor de idiomas
    if (elements.worldButton && elements.languageDropdown) {
      elements.worldButton.addEventListener('click', (e) => {
        e.preventDefault();
        elements.languageDropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!elements.languageDropdown.contains(e.target) && e.target !== elements.worldButton) {
          elements.languageDropdown.classList.remove('show');
        }
      });
    }

    // Opções de idioma
    if (elements.languageOptions) {
      elements.languageOptions.forEach(option => {
        option.addEventListener('click', async function() {
          IDIOMA_ORIGEM = await obterIdiomaCompleto(this.getAttribute('data-lang'));
          setupRecognition();
          
          if (elements.translatedText) {
            elements.translatedText.textContent = "✅";
            setTimeout(() => {
              if (elements.translatedText) elements.translatedText.textContent = "🎤";
            }, 1000);
          }
        });
      });
    }
  }

  // Inicialização
  async function initialize() {
    await setupMicrophone();
    setupEventListeners();
    console.log('Tradutor inicializado com sucesso');
  }

  // Iniciar aplicação
  initialize();
});
