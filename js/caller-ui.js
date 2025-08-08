import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = null;
  let localStream = null;

  // 🔓 Solicita acesso à câmera (original)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica ID na URL (original)
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Botão de chamada (original)
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // 🔇 Silencia áudio recebido (original)
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });

  // =============================================
  // 🔴 PARTE MODIFICADA (CONTROLES DE IDIOMA)
  // =============================================

  // 1. Chat box (original)
  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.style.padding = '10px';
  textDisplay.style.color = 'black';
  textDisplay.style.textAlign = 'center';
  textDisplay.style.height = '100%';
  textDisplay.style.display = 'flex';
  textDisplay.style.alignItems = 'center';
  textDisplay.style.justifyContent = 'center';
  textDisplay.style.wordBreak = 'break-word';
  textDisplay.style.overflowY = 'auto';
  chatBox.appendChild(textDisplay);

  // 2. Container de controles (original)
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

  // 3. Balão de idioma (original)
  const detectedLangBubble = document.createElement('div');
  detectedLangBubble.className = 'lang-bubble';
  detectedLangBubble.style.display = 'flex';
  detectedLangBubble.style.alignItems = 'center';
  detectedLangBubble.style.justifyContent = 'center';
  detectedLangBubble.style.width = '50px';
  detectedLangBubble.style.height = '50px';
  detectedLangBubble.style.backgroundColor = 'white';
  detectedLangBubble.style.borderRadius = '50%';
  detectedLangBubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  detectedLangBubble.style.cursor = 'pointer';
  detectedLangBubble.style.fontSize = '24px';
  langControls.appendChild(detectedLangBubble);

  // 4. Botão de seleção de idiomas (original)
  const langSelectButton = document.createElement('button');
  langSelectButton.className = 'lang-select-btn';
  langSelectButton.textContent = '🌐';
  langSelectButton.title = 'Selecionar idioma';
  langSelectButton.style.display = 'flex';
  langSelectButton.style.alignItems = 'center';
  langSelectButton.style.justifyContent = 'center';
  langSelectButton.style.width = '50px';
  langSelectButton.style.height = '50px';
  langSelectButton.style.backgroundColor = 'white';
  langSelectButton.style.borderRadius = '50%';
  langSelectButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  langSelectButton.style.border = 'none';
  langSelectButton.style.cursor = 'pointer';
  langSelectButton.style.fontSize = '24px';
  langControls.appendChild(langSelectButton);

  // 5. Menu de idiomas (original)
  const languageMenu = document.createElement('div');
  languageMenu.className = 'language-menu';
  languageMenu.style.display = 'none';
  languageMenu.style.position = 'absolute';
  languageMenu.style.backgroundColor = 'white';
  languageMenu.style.borderRadius = '8px';
  languageMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  languageMenu.style.padding = '10px';
  languageMenu.style.zIndex = '1000';
  languageMenu.style.minWidth = '60px';
  document.body.appendChild(languageMenu);

  // 6. Idiomas disponíveis (original)
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

  // 7. Detecção de idioma (original)
  const browserLanguage = navigator.language;
  let currentLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
  detectedLangBubble.textContent = currentLang.flag;
  detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;

  // 8. Popula menu (original)
  languages.forEach(lang => {
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-option';
    langBtn.innerHTML = `${lang.flag}`;
    langBtn.dataset.langCode = lang.code;
    langBtn.dataset.speakText = lang.speakText;
    langBtn.title = lang.name;
    langBtn.style.display = 'block';
    langBtn.style.width = '100%';
    langBtn.style.padding = '8px 12px';
    langBtn.style.textAlign = 'center';
    langBtn.style.border = 'none';
    langBtn.style.background = 'none';
    langBtn.style.cursor = 'pointer';
    langBtn.style.borderRadius = '4px';
    langBtn.style.margin = '2px 0';
    langBtn.style.fontSize = '24px';
    langBtn.addEventListener('mouseover', () => {
      langBtn.style.backgroundColor = '#f0f0f0';
    });
    langBtn.addEventListener('mouseout', () => {
      langBtn.style.backgroundColor = 'transparent';
    });
    languageMenu.appendChild(langBtn);
  });

  // 9. Controle do menu (original)
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

  // =============================================
  // 🔴 AJUSTES CRÍTICOS (SÓ AQUI HOUVE MODIFICAÇÕES)
  // =============================================

  // Função para pontuação automática (NOVO)
  function autoPontuar(texto, langCode) {
    if (!texto.trim()) return texto;
    const ultimoChar = texto[texto.length - 1];
    if (!['.', '!', '?', '。', '！', '？'].includes(ultimoChar)) {
      return texto + (texto.trim().endsWith('?') ? '?' : '.');
    }
    return texto;
  }

  // 10. Reconhecimento de voz (MODIFICADO para acumular texto)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;
  let accumulatedText = ''; // Variável nova para acumular texto

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLang.code;
    textDisplay.textContent = `${currentLang.flag} ${getClickToSpeakMessage(currentLang.code)}`;

    // Clique na bandeira (original com pequeno ajuste)
    detectedLangBubble.addEventListener('click', () => {
      if (!isListening) {
        recognition.start();
        textDisplay.innerHTML = `${currentLang.flag} ${currentLang.speakText}...`;
        isListening = true;
      } else {
        recognition.stop();
        isListening = false;
      }
    });

    // Menu de idiomas (original)
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        const flag = e.target.textContent;
        currentLang = languages.find(l => l.code === langCode);
        detectedLangBubble.textContent = currentLang.flag;
        detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;
        if (isListening) recognition.stop();
        recognition.lang = langCode;
        textDisplay.textContent = `${flag} ${getClickToSpeakMessage(langCode)}`;
        languageMenu.style.display = 'none';
      }
    });

    // 🔴 EVENTO ONRESULT MODIFICADO (acumula texto)
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += autoPontuar(transcript, currentLang.code);
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Acumula o texto final e mostra o interino
      if (finalTranscript) {
        accumulatedText += (accumulatedText ? '<br>' : '') + finalTranscript;
      }
      
      textDisplay.innerHTML = `
        ${currentLang.flag} ${accumulatedText || ''}
        ${interimTranscript ? `<br><i>${interimTranscript}</i>` : ''}
      `;
    };

    // Tratamento de erros (original)
    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      textDisplay.textContent = `${currentLang.flag} ${getErrorMessage(currentLang.code)}`;
      isListening = false;
    };

    recognition.onend = () => {
      if (isListening) recognition.start();
    };
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
  }

  // =============================================
  // 🔴 BOTÃO STOP (OPCIONAL - NOVO)
  // =============================================
  const stopButton = document.createElement('button');
  stopButton.textContent = '⏹️';
  stopButton.title = 'Parar captura';
  Object.assign(stopButton.style, langSelectButton.style); // Copia estilos
  stopButton.onclick = () => {
    if (isListening) {
      recognition.stop();
      isListening = false;
      // Mantém o texto acumulado
      textDisplay.innerHTML = textDisplay.innerHTML.replace(/\.\.\.$/, '');
    }
  };
  langControls.appendChild(stopButton);

  // Funções auxiliares (originais)
  function getClickToSpeakMessage(langCode) { /* ... */ }
  function getMicOffMessage(langCode) { /* ... */ }
  function getErrorMessage(langCode) { /* ... */ }
};
