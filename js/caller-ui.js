// webrtc-chat.js - Versão Completa Integrada

import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  // Elementos DOM
  const chatInputBox = document.querySelector('.chat-input-box');
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  
  // Configuração WebRTC
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // Variáveis de estado
  let targetId = null;
  let localStream = null;
  let currentLang = null;
  let isListening = false;

  // Idiomas disponíveis
  const languages = [
    { code: 'en-US', flag: '🇺🇸', speakText: 'Speak now', name: 'English' },
    { code: 'pt-BR', flag: '🇧🇷', speakText: 'Fale agora', name: 'Português' },
    { code: 'es-ES', flag: '🇪🇸', speakText: 'Habla agora', name: 'Español' },
    { code: 'fr-FR', flag: '🇫🇷', speakText: 'Parlez maintenant', name: 'Français' },
    { code: 'de-DE', flag: '🇩🇪', speakText: 'Sprechen Sie jetzt', name: 'Deutsch' },
    { code: 'ja-JP', flag: '🇯🇵', speakText: '話してください', name: '日本語' },
    { code: 'zh-CN', flag: '🇨🇳', speakText: '现在说话', name: '中文' },
    { code: 'ru-RU', flag: '🇷🇺', speakText: 'Говорите сейчас', name: 'Русский' },
    { code: 'ar-SA', flag: '🇸🇦', speakText: 'تحدث الآن', name: 'العربية' }
  ];

  // 1. Inicialização do chat
  const textDisplay = document.createElement('div');
  textDisplay.className = 'text-display-placeholder';
  chatInputBox.appendChild(textDisplay);

  // 2. Configuração do reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
  }

  // 3. Configuração inicial de idioma
  const browserLanguage = navigator.language;
  currentLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
  
  if (recognition) {
    recognition.lang = currentLang.code;
  }
  textDisplay.textContent = getClickToSpeakMessage(currentLang.code);

  // 4. Configuração dos controles de idioma
  const langControls = document.createElement('div');
  langControls.style.position = 'fixed';
  langControls.style.bottom = '80px';
  langControls.style.left = '50%';
  langControls.style.transform = 'translateX(-50%)';
  langControls.style.marginLeft = '-70px';
  langControls.style.zIndex = '100';
  langControls.style.display = 'flex';
  langControls.style.alignItems = 'center';
  langControls.style.gap = '10px';
  document.body.appendChild(langControls);

  // 5. Balão do idioma detectado
  const detectedLangBubble = document.createElement('div');
  detectedLangBubble.className = 'lang-bubble';
  detectedLangBubble.textContent = currentLang.flag;
  detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;
  // ... (estilos mantidos conforme original)
  langControls.appendChild(detectedLangBubble);

  // 6. Botão de seleção de idiomas
  const langSelectButton = document.createElement('button');
  langSelectButton.className = 'lang-select-btn';
  langSelectButton.textContent = '🌐';
  langSelectButton.title = 'Selecionar idioma';
  // ... (estilos mantidos conforme original)
  langControls.appendChild(langSelectButton);

  // 7. Menu de idiomas
  const languageMenu = document.createElement('div');
  languageMenu.className = 'language-menu';
  languageMenu.style.display = 'none';
  // ... (estilos e posicionamento mantidos conforme original)
  document.body.appendChild(languageMenu);

  // 8. Popula o menu de idiomas
  languages.forEach(lang => {
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-option';
    langBtn.innerHTML = `${lang.flag}`;
    langBtn.dataset.langCode = lang.code;
    langBtn.dataset.speakText = lang.speakText;
    langBtn.title = lang.name;
    // ... (estilos mantidos conforme original)
    languageMenu.appendChild(langBtn);
  });

  // 9. Event Handlers
  // Configuração da câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Chamada via URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Botão de chamada
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // Silencia áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });

  // Controle do menu de idiomas
  langSelectButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = langSelectButton.getBoundingClientRect();
    languageMenu.style.display = 'block';
    languageMenu.style.top = `${rect.top - languageMenu.offsetHeight - 10}px`;
    languageMenu.style.left = `${rect.left}px`;
  });

  document.addEventListener('click', () => {
    languageMenu.style.display = 'none';
  });

  // Seleção de idioma
  languageMenu.addEventListener('click', (e) => {
    if (e.target.classList.contains('lang-option')) {
      const langCode = e.target.dataset.langCode;
      const flag = e.target.textContent;
      const langName = e.target.title;

      currentLang = languages.find(l => l.code === langCode);
      detectedLangBubble.textContent = currentLang.flag;
      detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;

      if (isListening) {
        recognition.stop();
        isListening = false;
      }

      if (recognition) {
        recognition.lang = langCode;
      }
      textDisplay.textContent = `${getClickToSpeakMessage(langCode)}`;
      languageMenu.style.display = 'none';
    }
  });

  // Controle do microfone
  detectedLangBubble.addEventListener('click', () => {
    if (!recognition) {
      textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
      return;
    }

    if (!isListening) {
      try {
        recognition.start();
        textDisplay.textContent = `${currentLang.speakText}...`;
        isListening = true;
      } catch (e) {
        console.error('Erro ao iniciar microfone:', e);
        textDisplay.textContent = `${getErrorMessage(currentLang.code)}`;
      }
    } else {
      recognition.stop();
      textDisplay.textContent = `${getMicOffMessage(currentLang.code)}`;
      isListening = false;
    }
  });

  // Handlers do reconhecimento de voz
  if (recognition) {
    recognition.onresult = (event) => {
      // Esconde placeholder ao detectar fala
      if (textDisplay.classList.contains('text-display-placeholder')) {
        textDisplay.style.display = 'none';
      }

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        const phraseBox = document.createElement('div');
        phraseBox.className = 'phrase-box';
        phraseBox.innerHTML = `${finalTranscript} <i>${interimTranscript}</i>`;
        chatInputBox.appendChild(phraseBox);
      }
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      textDisplay.textContent = `${getErrorMessage(currentLang.code)}`;
      isListening = false;
    };

    recognition.onend = () => {
      if (!document.querySelector('.phrase-box')) {
        textDisplay.style.display = 'flex';
      }

      if (isListening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.error('Erro ao reiniciar:', e);
            isListening = false;
            textDisplay.textContent = `${getErrorMessage(currentLang.code)}`;
          }
        }, 300);
      }
    };
  }

  // Funções auxiliares
  function getClickToSpeakMessage(langCode) {
    const messages = {
      'en-US': 'Click flag to speak',
      'pt-BR': 'Clique na bandeira para falar',
      // ... (outros idiomas mantidos conforme original)
    };
    return messages[langCode] || messages['en-US'];
  }

  function getMicOffMessage(langCode) {
    const messages = {
      'en-US': 'Microphone off',
      'pt-BR': 'Microfone desativado',
      // ... (outros idiomas mantidos conforme original)
    };
    return messages[langCode] || messages['en-US'];
  }

  function getErrorMessage(langCode) {
    const messages = {
      'en-US': 'Microphone error',
      'pt-BR': 'Erro no microfone',
      // ... (outros idiomas mantidos conforme original)
    };
    return messages[langCode] || messages['en-US'];
  }
};
