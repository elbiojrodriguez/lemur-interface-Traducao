import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;
  let targetId = null;

   // Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Exibe o ID na interface
  document.getElementById('myId').textContent = myId;

  // Inicializa WebRTC
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // 🌍 ENDPOINT DE TRADUÇÃO (adicionado do arquivo1)
  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

  // 🔁 FUNÇÃO DE TRADUÇÃO (adicionada do arquivo1)
  async function translateText(text, targetLang) {
    try {
      if (targetLang === 'en') return text; // Não traduzir se já for inglês

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

  // Captura da câmera (sem áudio)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      // Não mostramos o vídeo local — ele é usado apenas para envio
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica se há targetId na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');

  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';

    // Botão de chamada
    document.getElementById('callActionBtn').onclick = () => {
      if (localStream) {
        rtcCore.startCall(targetId, localStream);
      }
    };
  }

  // Quando receber vídeo remoto, exibe no localVideo
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream; // ← ESSENCIAL no seu projeto
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

  // 2. INPUT INVISÍVEL para controlar teclado
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'text';
  hiddenInput.style.position = 'absolute';
  hiddenInput.style.opacity = '0';
  hiddenInput.style.height = '0';
  hiddenInput.style.width = '0';
  hiddenInput.style.border = 'none';
  hiddenInput.style.padding = '0';
  hiddenInput.style.margin = '0';
  document.body.appendChild(hiddenInput);

  // 3. Criação do container dos controles
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

  // 4. Balão do idioma detectado (botão de pressionar)
  const detectedLangBubble = document.createElement('div');
  detectedLangBubble.className = 'lang-bubble';
  detectedLangBubble.style.display = 'flex';
  detectedLangBubble.style.alignItems = 'center';
  detectedLangBubble.style.justifyContent = 'center';
  detectedLangBubble.style.width = '60px';
  detectedLangBubble.style.height = '60px';
  detectedLangBubble.style.backgroundColor = 'white';
  detectedLangBubble.style.borderRadius = '50%';
  detectedLangBubble.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  detectedLangBubble.style.cursor = 'pointer';
  detectedLangBubble.style.fontSize = '28px';
  detectedLangBubble.style.transition = 'all 0.2s ease';
  detectedLangBubble.title = 'Pressione e segure para falar';
  langControls.appendChild(detectedLangBubble);

  // 5. Botão de seleção de idiomas (🌐)
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

  // 6. Menu de idiomas
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

  // 7. Idiomas disponíveis (agora com códigos simplificados)
  const languages = [
    { code: 'en', flag: '🇺🇸', speakText: 'Speak now', name: 'English' },
    { code: 'pt', flag: '🇧🇷', speakText: 'Fale agora', name: 'Português' },
    { code: 'es', flag: '🇪🇸', speakText: 'Habla agora', name: 'Español' },
    { code: 'fr', flag: '🇫🇷', speakText: 'Parlez maintenant', name: 'Français' },
    { code: 'de', flag: '🇩🇪', speakText: 'Sprechen Sie agora', name: 'Deutsch' },
    { code: 'ja', flag: '🇯🇵', speakText: '話してください', name: '日本語' },
    { code: 'zh', flag: '🇨🇳', speakText: '现在说话', name: '中文' },
    { code: 'ru', flag: '🇷🇺', speakText: 'Говорите сейчас', name: 'Русский' },
    { code: 'ar', flag: '🇸🇦', speakText: 'تحدث الآن', name: 'العربية' }
  ];

  // 8. Lógica de detecção de idioma
  const browserLanguage = navigator.language;
  let currentLang = languages.find(lang => browserLanguage.startsWith(lang.code)) || languages[0];
  detectedLangBubble.textContent = currentLang.flag;
  detectedLangBubble.title = `Idioma atual: ${currentLang.name}\nPressione e segure para falar`;

  // 9. Popula o menu de idiomas
  languages.forEach(lang => {
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-option';
    langBtn.innerHTML = `${lang.flag}`;
    langBtn.dataset.langCode = lang.code;
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

  // 10. Controle do menu
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

  // 11. Configuração do reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;
  let lastRecognizedText = '';
  let pressTimer = null;
  let isPressing = false;

  // ✅ Configurar callback para receber mensagens
  rtcCore.setTranslatedTextCallback((data) => {
    try {
      const message = JSON.parse(data);
      showTranslatedText(message.text, false);
    } catch (e) {
      console.error('Erro ao processar mensagem:', e);
    }
  });

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = currentLang.code === 'pt' ? 'pt-BR' : currentLang.code + '-' + currentLang.code.toUpperCase();

    // Mensagem inicial
    textDisplay.textContent = 'Pressione e segure a bandeira para falar';

    // ✅ SISTEMA DE PRESSIONAR E SEGURAR
    const startPress = () => {
      if (isListening) return;
      isPressing = true;
      pressTimer = setTimeout(() => {
        startVoiceRecognition();
      }, 300);
    };

    const endPress = () => {
      if (!isPressing) return;
      isPressing = false;
      clearTimeout(pressTimer);
      
      if (isListening) {
        stopVoiceRecognition();
        translateAndSendPhrase();
      }
    };

    detectedLangBubble.addEventListener('mousedown', startPress);
    detectedLangBubble.addEventListener('mouseup', endPress);
    detectedLangBubble.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startPress();
    });
    detectedLangBubble.addEventListener('touchend', (e) => {
      e.preventDefault();
      endPress();
    });

    // ✅ Menu de idiomas
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        const langName = e.target.title;

        document.querySelectorAll('.phrase-box').forEach(el => el.remove());
        textDisplay.style.display = 'flex';
        textDisplay.textContent = 'Pressione e segure a bandeira para falar';

        currentLang = languages.find(l => l.code === langCode);
        detectedLangBubble.textContent = currentLang.flag;
        detectedLangBubble.title = `Idioma atual: ${currentLang.name}\nPressione e segure para falar`;

        if (isListening) {
          recognition.stop();
          isListening = false;
        }

        recognition.lang = langCode === 'pt' ? 'pt-BR' : langCode + '-' + langCode.toUpperCase();
        languageMenu.style.display = 'none';
      }
    });

    // ✅ Resultado do reconhecimento
    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        lastRecognizedText = finalTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      textDisplay.textContent = 'Erro no microfone. Clique para tentar novamente.';
      textDisplay.style.display = 'flex';
      isListening = false;
      resetBubbleStyle();
    };

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.error('Erro ao reiniciar:', e);
            isListening = false;
            textDisplay.textContent = 'Erro no microfone';
            textDisplay.style.display = 'flex';
            resetBubbleStyle();
          }
        }, 300);
      }
    };
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    textDisplay.style.color = 'black';
  }

  // ✅ FUNÇÕES AUXILIARES
  function startVoiceRecognition() {
    try {
      hiddenInput.focus();
      recognition.start();
      textDisplay.textContent = 'Falando...';
      textDisplay.style.display = 'flex';
      isListening = true;
      
      // Feedback visual
      detectedLangBubble.style.backgroundColor = '#ff4444';
      detectedLangBubble.style.color = 'white';
      detectedLangBubble.style.transform = 'scale(1.1)';
    } catch (e) {
      console.error('Erro ao iniciar microfone:', e);
      textDisplay.textContent = 'Erro ao acessar o microfone';
      textDisplay.style.display = 'flex';
    }
  }

  function stopVoiceRecognition() {
    recognition.stop();
    isListening = false;
    resetBubbleStyle();
  }

  function resetBubbleStyle() {
    detectedLangBubble.style.backgroundColor = 'white';
    detectedLangBubble.style.color = 'black';
    detectedLangBubble.style.transform = 'scale(1)';
  }

  async function translateAndSendPhrase() {
    if (!lastRecognizedText.trim()) {
      textDisplay.textContent = 'Pressione e segure a bandeira para falar';
      return;
    }
    
    textDisplay.textContent = 'Traduzindo...';
    
    try {
      // ✅ USA SUA API DE TRADUÇÃO
      const translatedText = await translateText(lastRecognizedText, 'en');
      
      // ✅ ENVIAR via WebRTC
      if (rtcCore.dataChannel && rtcCore.dataChannel.readyState === 'open') {
        rtcCore.dataChannel.send(JSON.stringify({
          text: translatedText,
          originalLang: currentLang.code,
          timestamp: new Date().toISOString()
        }));
      }
      
      // ✅ MOSTRAR localmente
      showTranslatedText(translatedText, true);
      textDisplay.style.display = 'none';
      
    } catch (error) {
      console.error('Erro na tradução:', error);
      textDisplay.textContent = 'Erro na tradução';
    }
    
    lastRecognizedText = '';
  }

  function showTranslatedText(text, isOutgoing) {
    const phraseBox = document.createElement('div');
    phraseBox.className = 'phrase-box';
    phraseBox.textContent = text;
    
    if (isOutgoing) {
      phraseBox.style.background = '#DCF8C6';
      phraseBox.style.alignSelf = 'flex-end';
      phraseBox.style.marginLeft = 'auto';
      phraseBox.style.marginRight = '10px';
    } else {
      phraseBox.style.background = '#FFFFFF';
      phraseBox.style.alignSelf = 'flex-start';
      phraseBox.style.marginLeft = '10px';
    }
    
    phraseBox.style.padding = '10px';
    phraseBox.style.marginBottom = '5px';
    phraseBox.style.borderRadius = '10px';
    phraseBox.style.maxWidth = '70%';
    phraseBox.style.wordBreak = 'break-word';
    
    chatInputBox.appendChild(phraseBox);
    chatInputBox.scrollTop = chatInputBox.scrollHeight;
  }

  // 🚀 Traduz elementos da interface (seu código)
  const frasesParaTraduzir = {
    "translator-label": "Live translation. No filters. No platform.",
    "qr-modal-title": "This is your online key",
    "qr-modal-description": "You can ask to scan, share or print on your business card."
  };

  (async () => {
    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, currentLang.code);
        el.textContent = traduzido;
      }
    }
  })();
};
