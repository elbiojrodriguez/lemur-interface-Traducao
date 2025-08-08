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
langControls.style.bottom = '20px';       // 20px do fundo (ajuste conforme necessário)
langControls.style.left = '50%';          // Base do alinhamento central
langControls.style.transform = 'translateX(-50%)'; // Ajuste preciso do centro
langControls.style.marginLeft = '120px';    // Padrão (centralizado). Ajuste para mover:
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

    // 4. Botão de seleção de idiomas (🌐)
    const langSelectButton = document.createElement('button');
    langSelectButton.className = 'lang-select-btn';
    langSelectButton.textContent = '🌐';
    langSelectButton.title = 'Selecionar idioma';
    langSelectButton.style.background = 'none';
    langSelectButton.style.border = 'none';
    langSelectButton.style.cursor = 'pointer';
    langSelectButton.style.fontSize = '40px';
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

    // 9. Controle do menu (original inalterado)
    langSelectButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = langSelectButton.getBoundingClientRect();
        languageMenu.style.display = 'block';
        languageMenu.style.top = `${rect.top - languageMenu.offsetHeight - 10}px`;
        languageMenu.style.left = `${rect.left}px`;
    });

    detectedLangBubble.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = detectedLangBubble.getBoundingClientRect();
        languageMenu.style.display = 'block';
        languageMenu.style.top = `${rect.top - languageMenu.offsetHeight - 10}px`;
        languageMenu.style.left = `${rect.left}px`;
    });

    document.addEventListener('click', () => {
        languageMenu.style.display = 'none';
    });

    // 10. Configuração do reconhecimento de voz (original inalterado)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLang.code;
        textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;

        languageMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('lang-option')) {
                const langCode = e.target.dataset.langCode;
                const flag = e.target.textContent;
                const speakText = e.target.dataset.speakText;
                const langName = e.target.title;
                currentLang = languages.find(l => l.code === langCode);
                detectedLangBubble.textContent = currentLang.flag;
                detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;
                recognition.stop();
                recognition.lang = langCode;
                textDisplay.textContent = `${flag} ${speakText}...`;
                setTimeout(() => recognition.start(), 300);
                languageMenu.style.display = 'none';
            }
        });

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            textDisplay.innerHTML = finalTranscript + '<i>' + interimTranscript + '</i>';
        };

        recognition.onerror = (event) => {
            console.error('Erro no reconhecimento:', event.error);
            textDisplay.style.color = 'black';
        };

        setTimeout(() => recognition.start(), 1000);
    } else {
        textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
        textDisplay.style.color = 'black';
        console.error('API de reconhecimento de voz não suportada');
    }
};
