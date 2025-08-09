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

  // 🔓 Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica se há ID na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Configura o botão de chamada
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // 🔇 Silencia qualquer áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });


    // #############################################
    // 🔴 PARTE MODIFICADA: Controles de idioma dinâmicos (sem depender do HTML)
    // #############################################

    // 1. Configuração do chat (box azul)
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

    // 2. Criação do container dos controles (agora independente)
    const langControls = document.createElement('div');
    langControls.style.position = 'fixed';
    langControls.style.bottom = '80px';       // 20px do fundo (ajuste conforme necessário)
    langControls.style.left = '50%';          // Base do alinhamento central
    langControls.style.transform = 'translateX(-50%)'; // Ajuste preciso do centro
    langControls.style.marginLeft = '-70px';    // Padrão (centralizado). Ajuste para mover:
                                         // Valores positivos → Direita | Negativos → Esquerda
   langControls.style.zIndex = '100';
   langControls.style.display = 'flex';
   langControls.style.alignItems = 'center';
   langControls.style.gap = '10px';
    document.body.appendChild(langControls); // Anexa ao body, não ao .controls

    // 3. Balão do idioma detectado (mesmo estilo original)
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

    // 4. Botão de seleção de idiomas (🌐) - PADRÃO IGUAL AO BALÃO
const langSelectButton = document.createElement('button');
langSelectButton.className = 'lang-select-btn';
langSelectButton.textContent = '🌐';
langSelectButton.title = 'Selecionar idioma';
// ESTILOS IDÊNTICOS AO BALÃO DE BANDEIRA:
langSelectButton.style.display = 'flex';
langSelectButton.style.alignItems = 'center';
langSelectButton.style.justifyContent = 'center';
langSelectButton.style.width = '50px'; // Mesmo tamanho
langSelectButton.style.height = '50px'; // que o balão
langSelectButton.style.backgroundColor = 'white'; // Fundo branco
langSelectButton.style.borderRadius = '50%'; // Borda redonda
langSelectButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)'; // Sombra suave
langSelectButton.style.border = 'none'; // Remove borda padrão do botão
langSelectButton.style.cursor = 'pointer';
langSelectButton.style.fontSize = '24px'; // Reduzi de 40px para 24px (igual ao balão)
langControls.appendChild(langSelectButton);

    // 5. Menu de idiomas (mesmo código original)
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

    // 6. Idiomas disponíveis (original inalterado)
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

    // 7. Lógica de detecção de idioma (original inalterada)
    const browserLanguage = navigator.language;
    let currentLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
    detectedLangBubble.textContent = currentLang.flag;
    detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;

    // 8. Popula o menu de idiomas (original inalterado)
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

        // 9. Controle do menu (ATUALIZADO - apenas botão 🌐 abre o menu)
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

    document.addEventListener('click', () => {
        languageMenu.style.display = 'none';
    });

// 10. Configuração do reconhecimento de voz (modificado para controle manual)
// Configuração SIMPLIFICADA do reconhecimento de voz
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;  // Importante para Android
recognition.interimResults = false;
recognition.lang = currentLang.code;

// Controle do microfone (liga/desliga ao clicar na bandeira)
detectedLangBubble.addEventListener('click', () => {
  if (recognition.isListening) {
    recognition.stop();
    recognition.isListening = false;
  } else {
    recognition.start();
    recognition.isListening = true;
  }
});

// Quando detectar fala
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript.trim();
  if (transcript) {
    // Cria bloco com a frase
    const phraseBox = document.createElement('div');
    phraseBox.className = 'phrase-box';
    phraseBox.textContent = `${currentLang.flag} ${transcript}`;
    document.getElementById('chatContainer').appendChild(phraseBox);
    
    // Envia via Socket.IO (se existir)
    if (typeof socket !== 'undefined') {
      socket.emit('mensagem', { 
        texto: transcript, 
        idioma: currentLang.code 
      });
    }
  }
};

// Se der erro
recognition.onerror = (e) => {
  console.log('Erro:', e.error);
};

// Reinicia automaticamente
recognition.onend = () => {
  if (recognition.isListening) {
    recognition.start();
  }
};

// Inicia pela primeira vez
recognition.isListening = true;
recognition.start();
};

    // Tratamento de erros
    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento:', event.error);
        textDisplay.textContent = `${currentLang.flag} ${getErrorMessage(currentLang.code)}`;
        isListening = false;
    };

    // Quando o reconhecimento termina naturalmente
    recognition.onend = () => {
        if (isListening) {
            recognition.start();
        }
    };
} else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    textDisplay.style.color = 'black';
    console.error('API de reconhecimento de voz não suportada');
}

// Funções auxiliares para traduzir mensagens (adicionar ANTES do bloco 10)
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
