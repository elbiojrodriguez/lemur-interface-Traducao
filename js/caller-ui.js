import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // [Código de configuração de vídeo permanece igual...]

  // #############################################
  // IMPLEMENTAÇÃO COMPLETA DO RECONHECIMENTO DE VOZ
  // #############################################

  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.style.padding = '10px';
  textDisplay.style.color = 'black'; // Texto sempre preto
  textDisplay.style.textAlign = 'center';
  textDisplay.style.height = '100%';
  textDisplay.style.display = 'flex';
  textDisplay.style.alignItems = 'center';
  textDisplay.style.justifyContent = 'center';
  textDisplay.style.wordBreak = 'break-word';
  textDisplay.style.overflowY = 'auto';
  chatBox.appendChild(textDisplay);

  // Container para os controles de idioma
  const langControls = document.createElement('div');
  langControls.style.display = 'flex';
  langControls.style.alignItems = 'center';
  langControls.style.gap = '10px';
  langControls.style.position = 'absolute';
  langControls.style.bottom = '20px';
  langControls.style.right = '20px';
  langControls.style.zIndex = '100';
  document.querySelector('.controls').appendChild(langControls);

  // Balão do idioma detectado
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

  // Botão de seleção de idiomas (🌐)
  const langSelectButton = document.createElement('button');
  langSelectButton.className = 'lang-select-btn';
  langSelectButton.textContent = '🌐';
  langSelectButton.title = 'Selecionar idioma';
  langSelectButton.style.background = 'none';
  langSelectButton.style.border = 'none';
  langSelectButton.style.cursor = 'pointer';
  langSelectButton.style.fontSize = '40px';
  langControls.appendChild(langSelectButton);

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
  document.body.appendChild(languageMenu);

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
  let currentLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
  
  // Atualiza o balão com o idioma detectado
  detectedLangBubble.textContent = currentLang.flag;
  detectedLangBubble.title = `Idioma atual: ${currentLang.name}`;

  // Adiciona os idiomas ao menu
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

  // Controle do menu
  langSelectButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = langSelectButton.getBoundingClientRect();
    languageMenu.style.display = 'block';
    languageMenu.style.top = `${rect.top - languageMenu.offsetHeight - 10}px`;
    languageMenu.style.left = `${rect.left}px`;
  });

  // Clicar no balão também abre o menu
  detectedLangBubble.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = detectedLangBubble.getBoundingClientRect();
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
    recognition.lang = currentLang.code;

    // Exibe mensagem inicial
    textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;

    // Seleção de idioma
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        const flag = e.target.textContent;
        const speakText = e.target.dataset.speakText;
        const langName = e.target.title;
        
        // Atualiza o idioma atual
        currentLang = languages.find(l => l.code === langCode);
        
        // Atualiza o balão
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
      textDisplay.style.color = 'black'; // Garante texto preto mesmo em mensagens de erro
      // [Tratamento de erros permanece igual...]
    };

    // Inicia o reconhecimento
    setTimeout(() => recognition.start(), 1000);
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    textDisplay.style.color = 'black';
    console.error('API de reconhecimento de voz não suportada');
  }
};

