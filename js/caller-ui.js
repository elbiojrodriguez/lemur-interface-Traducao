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

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica ID na URL
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

  // Silencia áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });

  // #############################################
  // IMPLEMENTAÇÃO COMPLETA DO RECONHECIMENTO DE VOZ
  // #############################################

  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.style.padding = '10px';
  textDisplay.style.color = 'white';
  textDisplay.style.textAlign = 'center';
  textDisplay.style.height = '100%';
  textDisplay.style.display = 'flex';
  textDisplay.style.alignItems = 'center';
  textDisplay.style.justifyContent = 'center';
  textDisplay.style.wordBreak = 'break-word';
  textDisplay.style.overflowY = 'auto';
  chatBox.appendChild(textDisplay);

  // Criação do botão da ONU
  const unButton = document.createElement('button');
  unButton.className = 'lang-btn un-btn';
  unButton.textContent = '🌐';
  unButton.title = 'Selecionar idioma';
  unButton.style.background = 'none';
  unButton.style.border = 'none';
  unButton.style.cursor = 'pointer';
  unButton.style.fontSize = '40px';
  unButton.style.position = 'absolute';
  unButton.style.bottom = '20px';
  unButton.style.right = '20px';
  unButton.style.zIndex = '100';
  document.querySelector('.controls').appendChild(unButton);

  // Menu de idiomas flutuante
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
  
  // Idiomas disponíveis com mensagens localizadas
  const languages = [
    { code: 'en-US', flag: '🇺🇸', speakText: 'Speak now', name: 'English' },
    { code: 'pt-BR', flag: '🇧🇷', speakText: 'Fale agora', name: 'Português' },
    { code: 'es-ES', flag: '🇪🇸', speakText: 'Habla ahora', name: 'Español' },
    { code: 'fr-FR', flag: '🇫🇷', speakText: 'Parlez maintenant', name: 'Français' },
    { code: 'de-DE', flag: '🇩🇪', speakText: 'Sprechen Sie jetzt', name: 'Deutsch' },
    { code: 'ja-JP', flag: '🇯🇵', speakText: '話してください', name: '日本語' },
    { code: 'zh-CN', flag: '🇨🇳', speakText: '现在说话', name: '中文' },
    { code: 'ru-RU', flag: '🇷🇺', speakText: 'Говорите сейчас', name: 'Русский' },
    { code: 'ar-SA', flag: '🇸🇦', speakText: 'تحدث الآن', name: 'العربية' }
  ];

  // Detecta o idioma do navegador
  const browserLanguage = navigator.language;
  let detectedLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
  
  // Cria botão automático com o idioma detectado
  const autoLangBtn = document.createElement('button');
  autoLangBtn.className = 'lang-option auto-lang';
  autoLangBtn.innerHTML = `${detectedLang.flag}`;
  autoLangBtn.dataset.langCode = detectedLang.code;
  autoLangBtn.dataset.speakText = detectedLang.speakText;
  autoLangBtn.title = `Idioma detectado: ${detectedLang.name}`;
  autoLangBtn.style.fontWeight = 'bold'; // Destaque para o idioma detectado
  
  // Adiciona o botão automático no início do menu
  languageMenu.appendChild(autoLangBtn);
  
  // Adiciona separador
  const separator = document.createElement('div');
  separator.style.height = '1px';
  separator.style.backgroundColor = '#eee';
  separator.style.margin = '5px 0';
  languageMenu.appendChild(separator);

  // Adiciona os demais idiomas ao menu
  languages.forEach(lang => {
    if (lang.code !== detectedLang.code) {
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
    }
  });

  document.body.appendChild(languageMenu);

  // Controle do menu
  unButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = unButton.getBoundingClientRect();
    languageMenu.style.display = 'block';
    languageMenu.style.top = `${rect.top - languageMenu.offsetHeight - 10}px`;
    languageMenu.style.left = `${rect.left}px`;
  });

  // Fecha o menu ao clicar fora
  document.addEventListener('click', () => {
    languageMenu.style.display = 'none';
  });

  // Configuração do reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Inicia com o idioma detectado automaticamente
    recognition.lang = detectedLang.code;
    textDisplay.textContent = `${detectedLang.flag} ${detectedLang.speakText}...`;

    // Seleção de idioma
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        const flag = e.target.textContent;
        const speakText = e.target.dataset.speakText;
        
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
      if (event.error === 'no-speech') {
        textDisplay.textContent = 'Nenhuma fala detectada. Tente novamente.';
      } else if (event.error === 'audio-capture') {
        textDisplay.textContent = 'Microfone não encontrado. Verifique suas permissões.';
      } else if (event.error === 'not-allowed') {
        textDisplay.textContent = 'Permissão para usar o microfone foi negada.';
      }
    };

    recognition.onend = () => {
      console.log('Reconhecimento de voz encerrado');
      // Pode reiniciar automaticamente se desejado
      // setTimeout(() => recognition.start(), 500);
    };

    // Inicia o reconhecimento
    setTimeout(() => recognition.start(), 1000);
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    console.error('API de reconhecimento de voz não suportada neste navegador');
  }
};
