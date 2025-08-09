// receiver-ui.js (versão integrada)
import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;
  
  // Detecta se é a página caller (baseado na URL ou elemento existente)
  const isCallerPage = window.location.pathname.includes('caller.html') || 
                      document.getElementById('callActionBtn') !== null;

  // Elementos de vídeo
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');

  // Solicita acesso à câmera (comum a ambos)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      
      // Configuração específica para caller
      if (isCallerPage && remoteVideo) {
        remoteVideo.srcObject = stream;
      }
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // =============================================
  // Funcionalidades do Receiver (original)
  // =============================================
  if (!isCallerPage) {
    // Gera QR Code com link para caller
    const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
    QRCodeGenerator.generate("qrcode", callerUrl);

    rtcCore.initialize(myId);
    rtcCore.setupSocketHandlers();

    rtcCore.onIncomingCall = (offer) => {
      if (!localStream) {
        console.warn("Stream local não disponível");
        return;
      }

      rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        // Silencia áudio recebido
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);

        // Oculta o QR Code
        const qrElement = document.getElementById('qrcode');
        if (qrElement) qrElement.style.display = 'none';

        // Exibe vídeo remoto no PIP
        if (localVideo) localVideo.srcObject = remoteStream;
      });
    };
  }
  
  // =============================================
  // Funcionalidades do Caller (integrado condicionalmente)
  // =============================================
  if (isCallerPage) {
    const chatInputBox = document.querySelector('.chat-input-box');
    
    // Inicializa apenas se for a página caller
    rtcCore.initialize(myId);
    rtcCore.setupSocketHandlers();
    
    if (document.getElementById('myId')) {
      document.getElementById('myId').textContent = myId;
    }

    let targetId = null;
    const urlParams = new URLSearchParams(window.location.search);
    const targetIdFromUrl = urlParams.get('targetId');
    
    if (targetIdFromUrl) {
      targetId = targetIdFromUrl;
      const callActionBtn = document.getElementById('callActionBtn');
      if (callActionBtn) callActionBtn.style.display = 'block';
    }

    // Configura o botão de chamada
    const callActionBtn = document.getElementById('callActionBtn');
    if (callActionBtn) {
      callActionBtn.onclick = () => {
        if (!targetId || !localStream) return;
        rtcCore.startCall(targetId, localStream);
      };
    }

    // Configura callback para stream remoto
    rtcCore.setRemoteStreamCallback(stream => {
      stream.getAudioTracks().forEach(track => track.enabled = false);
      if (localVideo) localVideo.srcObject = stream;
    });

    // =============================================
    // Sistema de Reconhecimento de Voz (apenas para caller)
    // =============================================
    if (chatInputBox) {
      setupVoiceRecognition(chatInputBox);
    }
  }
};

// =============================================
// Módulo de Reconhecimento de Voz (isolado)
// =============================================
function setupVoiceRecognition(chatInputBox) {
  // 1. Configuração do chat (box azul)
  const textDisplay = document.createElement('div');
  textDisplay.className = 'text-display-placeholder';
  Object.assign(textDisplay.style, {
    padding: '10px',
    color: 'black',
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    wordBreak: 'break-word',
    overflowY: 'auto'
  });
  chatInputBox.appendChild(textDisplay);

  // 2. Criação do container dos controles
  const langControls = document.createElement('div');
  Object.assign(langControls.style, {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    marginLeft: '-70px',
    zIndex: '100',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  });
  document.body.appendChild(langControls);

  // 3. Balão do idioma detectado
  const detectedLangBubble = document.createElement('div');
  detectedLangBubble.className = 'lang-bubble';
  Object.assign(detectedLangBubble.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50px',
    height: '50px',
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    fontSize: '24px'
  });
  langControls.appendChild(detectedLangBubble);

  // 4. Botão de seleção de idiomas (🌐)
  const langSelectButton = document.createElement('button');
  langSelectButton.className = 'lang-select-btn';
  langSelectButton.textContent = '🌐';
  langSelectButton.title = 'Selecionar idioma';
  Object.assign(langSelectButton.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50px',
    height: '50px',
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '24px'
  });
  langControls.appendChild(langSelectButton);

  // 5. Menu de idiomas
  const languageMenu = document.createElement('div');
  languageMenu.className = 'language-menu';
  Object.assign(languageMenu.style, {
    display: 'none',
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    padding: '10px',
    zIndex: '1000',
    minWidth: '60px'
  });
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
    Object.assign(langBtn.style, {
      display: 'block',
      width: '100%',
      padding: '8px 12px',
      textAlign: 'center',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      borderRadius: '4px',
      margin: '2px 0',
      fontSize: '24px'
    });
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
      } else if (interimTranscript) {
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
}
