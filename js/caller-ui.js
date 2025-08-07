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

  // Acesso à câmera
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

  // Implementação do reconhecimento de voz
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

  // Cria elementos de controle de idioma
  const langContainer = document.querySelector('.lang-controls-container');
  
  // Balão do idioma detectado
  const detectedLangBubble = document.createElement('div');
  detectedLangBubble.className = 'lang-bubble';
  langContainer.appendChild(detectedLangBubble);

  // Botão de seleção de idiomas
  const langSelectButton = document.createElement('button');
  langSelectButton.className = 'lang-select-btn';
  langSelectButton.textContent = '🌐';
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

  // Adiciona idiomas ao menu
  languages.forEach(lang => {
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-option';
    langBtn.innerHTML = `${lang.flag}`;
    langBtn.dataset.langCode = lang.code;
    langBtn.dataset.speakText = lang.speakText;
    langBtn.title = lang.name;
    languageMenu.appendChild(langBtn);
  });

  // Abre menu ao clicar no botão 🌐
  langSelectButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = langSelectButton.getBoundingClientRect();
    languageMenu.style.display = 'block';
    languageMenu.style.top = `${rect.top - languageMenu.offsetHeight - 10}px`;
    languageMenu.style.left = `${rect.left}px`;
  });

  // Fecha menu ao clicar fora
  document.addEventListener('click', () => {
    languageMenu.style.display = 'none';
  });

  // Configura reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLang.code;

    // Mensagem inicial
    textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;

    // Seleção de idioma
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

    // Inicia reconhecimento
    setTimeout(() => recognition.start(), 1000);
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    textDisplay.style.color = 'black';
    console.error('API de reconhecimento de voz não suportada');
  }
};
