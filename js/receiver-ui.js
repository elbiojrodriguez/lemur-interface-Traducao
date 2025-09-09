import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  
  // PEGA PARÂMETROS DA URL DO APPLICATIVO
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const browserid = urlParams.get('browserid'); // últimos 8 dígitos do token
  const lang = urlParams.get('lang');
  const name = urlParams.get('name');

  // ✅ USA browserid COMO ID DO WEBRTC (FIXO/ESPECÍFICO)
  const myId = browserid; // SEM UUID ALEATÓRIO!
  
  let localStream = null;

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // ✅ GERA QR Code com targetId ESPECÍFICO (browserid)
  const callerUrl = `https://lemur-interface-traducao.netlify.app/caller.html?targetId=${browserid}&token=${token}&lang=${lang}&name=${name}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  rtcCore.initialize(myId); // ✅ Registra com ID ESPECÍFICO
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Stream local não disponível");
      return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // 🔇 Silencia áudio recebido
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // 🔥 Oculta o QR Code
      const qrElement = document.getElementById('qrcode');
      if (qrElement) qrElement.style.display = 'none';

      // Exibe vídeo remoto no PIP
      localVideo.srcObject = remoteStream;
    });
  };
};

  // ==============================================
  // CÓDIGO 100% ORIGINAL DO CALLER (INTACTO) 
  // ==============================================
  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCoreCaller = new WebRTCCore();
  const myIdCaller = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myIdCaller;
  rtcCoreCaller.initialize(myIdCaller);
  rtcCoreCaller.setupSocketHandlers();

  const localVideoCaller = document.getElementById('localVideo');
  const remoteVideoCaller = document.getElementById('remoteVideo');
  let targetId = null;
  let localStreamCaller = null;

  // Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStreamCaller = stream;
      remoteVideoCaller.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica se há ID na URL
  const urlParamsCaller = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParamsCaller.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Configura o botão de chamada
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStreamCaller) return;
    rtcCoreCaller.startCall(targetId, localStreamCaller);
  };

  // Silencia qualquer áudio recebido
  rtcCoreCaller.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideoCaller.srcObject = stream;
  });

  // #############################################
  // Controles de idioma dinâmicos
  // #############################################

  // 1. Configuração do chat (box azul)
  const textDisplay = document.createElement('div');
  textDisplay.className = 'text-display-placeholder';
  textDisplay.style.padding = '10px';
  textDisplay.style.color = 'black';
  textDisplay.style.textAlign = 'center';
  textDisplay.style.height = '100%';
  textDisplay.style.display = 'flex';
  textDisplay.style.alignItems = 'center';
  textDisplay.style.justifyContent = 'center';
  textDisplay.style.wordBreak = 'break-word';
  textDisplay.style.overflowY = 'auto';
  chatInputBox.appendChild(textDisplay);

  // 2. Criação do container dos controles
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

  // 3. Balão do idioma detectado
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

  // 4. Botão de seleção de idiomas (🌐)
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

  // 5. Menu de idiomas
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

  // 6. Idiomas disponíveis
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

  // 7. Lógica de detecção de idioma
  const browserLanguage = navigator.language;
  let currentLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
  detectedLangBubble.textContent = currentLang.flag;
  detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;

  // 8. Popula o menu de idiomas
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

  // 9. Controle do menu
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

  // 10. Configuração do reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentLang.code;

    // Mensagem inicial no idioma correto
    textDisplay.textContent = `${getClickToSpeakMessage(currentLang.code)}`;

    // Clique na bandeira ativa/desativa o microfone
    detectedLangBubble.addEventListener('click', () => {
      if (!isListening) {
        try {
          recognition.start();
          textDisplay.textContent = `${currentLang.speakText}...`;
          textDisplay.style.display = 'flex';
          isListening = true;
        } catch (e) {
          console.error('Erro ao iniciar microfone:', e);
          textDisplay.textContent = `${getErrorMessage(currentLang.code)}`;
          textDisplay.style.display = 'flex';
        }
      } else {
        recognition.stop();
        textDisplay.textContent = `${getMicOffMessage(currentLang.code)}`;
        textDisplay.style.display = 'flex';
        isListening = false;
      }
    });

    // Menu de idiomas
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        const flag = e.target.textContent;
        const langName = e.target.title;

        document.querySelectorAll('.phrase-box').forEach(el => el.remove());
        textDisplay.style.display = 'flex';
        textDisplay.textContent = getClickToSpeakMessage(langCode);

        currentLang = languages.find(l => l.code === langCode);
        detectedLangBubble.textContent = currentLang.flag;
        detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;

        if (isListening) {
          recognition.stop();
          isListening = false;
        }

        recognition.lang = langCode;
        languageMenu.style.display = 'none';
      }
    });

    recognition.onresult = (event) => {
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

      const chatInputBox = document.querySelector('.chat-input-box');
      
      if (finalTranscript.trim()) {
        const interimBox = document.querySelector('.interim-box');
        if (interimBox) interimBox.remove();
        
        const phraseBox = document.createElement('div');
        phraseBox.className = 'phrase-box';
        phraseBox.textContent = finalTranscript;
        
        if (chatInputBox) {
          chatInputBox.appendChild(phraseBox);
          chatInputBox.scrollTop = chatInputBox.scrollHeight;
          textDisplay.textContent = `${currentLang.speakText}...`;
        }
      }
      else if (interimTranscript) {
        let interimBox = document.querySelector('.interim-box');
        
        if (!interimBox) {
          interimBox = document.createElement('div');
          interimBox.className = 'interim-box';
          if (chatInputBox) chatInputBox.appendChild(interimBox);
        }
        
        interimBox.textContent = interimTranscript;
        if (chatInputBox) chatInputBox.scrollTop = chatInputBox.scrollHeight;
      }
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      textDisplay.textContent = `${getErrorMessage(currentLang.code)}`;
      textDisplay.style.display = 'flex';
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
            textDisplay.style.display = 'flex';
          }
        }, 300);
      }
    };
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    textDisplay.style.color = 'black';
    console.error('API de reconhecimento de voz não suportada');
  }

  // Funções auxiliares para mensagens
  function getClickToSpeakMessage(langCode) {
    const messages = {
      'en-US': 'Click flag to speak',
      'pt-BR': 'Clique na bandeira para falar',
      'es-ES': 'Haz clic en la bandera para hablar',
      'fr-FR': 'Cliquez sur le drapeau pour parler',
      'de-DE': 'Klicken Sie auf die Flagge zum Sprechen',
      'ja-JP': '旗をクリックして話す',
      'zh-CN': '点击旗帜说话',
      'ru-RU': 'Нажмите на флаг, чтобы говорить',
      'ar-SA': 'انقر على العلم للتحدث'
    };
    return messages[langCode] || messages['en-US'];
  }

  function getMicOffMessage(langCode) {
    const messages = {
      'en-US': 'Microphone off',
      'pt-BR': 'Microfone desativado',
      'es-ES': 'Micrófono desactivado',
      'fr-FR': 'Microphone désactivé',
      'de-DE': 'Mikrofon ausgeschaltet',
      'ja-JP': 'マイクオフ',
      'zh-CN': '麦克风关闭',
      'ru-RU': 'Микрофон выключен',
      'ar-SA': 'تم إيقاف الميكروفون'
    };
    return messages[langCode] || messages['en-US'];
  }

  function getErrorMessage(langCode) {
    const messages = {
      'en-US': 'Microphone error',
      'pt-BR': 'Erro no microfone',
      'es-ES': 'Error de micrófono',
      'fr-FR': 'Erreur de microphone',
      'de-DE': 'Mikrofonfehler',
      'ja-JP': 'マイクエラー',
      'zh-CN': '麦克风错误',
      'ru-RU': 'Ошибка микрофона',
      'ar-SA': 'خطأ في الميكروفون'
    };
    return messages[langCode] || messages['en-US'];
  }
};
