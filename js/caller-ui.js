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

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });

  // Configuração do chat
  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.style.cssText = `
    padding: 10px;
    color: black;
    text-align: center;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    word-break: break-word;
    overflow-y: auto;
  `;
  chatBox.appendChild(textDisplay);

  // Controles de idioma
  const langContainer = document.querySelector('.lang-controls-container');
  
  // 1. Balão do idioma detectado (SEMPRE VISÍVEL)
  const detectedLangBubble = document.createElement('div');
  detectedLangBubble.className = 'lang-bubble';
  langContainer.appendChild(detectedLangBubble);

  // 2. Botão seletor de idiomas (SEMPRE VISÍVEL)
  const langSelectButton = document.createElement('button');
  langSelectButton.className = 'lang-select-btn';
  langSelectButton.innerHTML = '🌐';
  langSelectButton.title = 'Selecionar idioma';
  langContainer.appendChild(langSelectButton);

  // Menu de idiomas
  const languageMenu = document.createElement('div');
  languageMenu.className = 'language-menu';
  document.body.appendChild(languageMenu);

  // Idiomas disponíveis
  const languages = [
    { code: 'en-US', flag: '🇺🇸', speakText: 'Speak now', name: 'English' },
    { code: 'pt-BR', flag: '🇧🇷', speakText: 'Fale agora', name: 'Português' },
    { code: 'es-ES', flag: '🇪🇸', speakText: 'Habla ahora', name: 'Español' }
  ];

  // Detecta idioma do navegador
  const browserLanguage = navigator.language;
  let currentLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
  
  // Atualiza balão com idioma detectado
  detectedLangBubble.textContent = currentLang.flag;
  detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;

  // Popula menu de idiomas
  languages.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-option';
    btn.innerHTML = `${lang.flag}`;
    btn.dataset.langCode = lang.code;
    btn.dataset.speakText = lang.speakText;
    btn.title = lang.name;
    languageMenu.appendChild(btn);
  });

  // Eventos do menu
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

  // Configura reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLang.code;

    textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;

    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        currentLang = languages.find(l => l.code === langCode);
        
        detectedLangBubble.textContent = currentLang.flag;
        detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;
        
        recognition.stop();
        recognition.lang = langCode;
        textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;
        
        setTimeout(() => recognition.start(), 300);
        languageMenu.style.display = 'none';
      }
    });

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        event.results[i].isFinal ? (final += transcript + ' ') : (interim += transcript);
      }
      textDisplay.innerHTML = final + '<i>' + interim + '</i>';
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
    };

    setTimeout(() => recognition.start(), 1000);
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
  }
};
