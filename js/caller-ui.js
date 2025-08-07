import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // #############################################
  // IMPLEMENTAÇÃO COMPLETA DO RECONHECIMENTO DE VOZ
  // #############################################

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

  // 1. BALÃO DO IDIOMA NATIVO (NUNCA MUDA)
  const nativeLangBubble = document.createElement('div');
  nativeLangBubble.className = 'native-lang-bubble';
  nativeLangBubble.style.display = 'flex';
  nativeLangBubble.style.alignItems = 'center';
  nativeLangBubble.style.justifyContent = 'center';
  nativeLangBubble.style.width = '50px';
  nativeLangBubble.style.height = '50px';
  nativeLangBubble.style.backgroundColor = '#f0f0f0';
  nativeLangBubble.style.borderRadius = '50%';
  nativeLangBubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
  nativeLangBubble.style.fontSize = '24px';
  langControls.appendChild(nativeLangBubble);

  // 2. BALÃO DO IDIOMA SELECIONADO (INICIA COM 🌐)
  const selectedLangBubble = document.createElement('div');
  selectedLangBubble.className = 'selected-lang-bubble';
  selectedLangBubble.style.display = 'flex';
  selectedLangBubble.style.alignItems = 'center';
  selectedLangBubble.style.justifyContent = 'center';
  selectedLangBubble.style.width = '50px';
  selectedLangBubble.style.height = '50px';
  selectedLangBubble.style.backgroundColor = 'white';
  selectedLangBubble.style.borderRadius = '50%';
  selectedLangBubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  selectedLangBubble.style.cursor = 'pointer';
  selectedLangBubble.style.fontSize = '24px';
  langControls.appendChild(selectedLangBubble);

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

  // Detecta o idioma NATIVO do navegador
  const browserLanguage = navigator.language;
  const nativeLang = languages.find(lang => browserLanguage.startsWith(lang.code.split('-')[0])) || languages[0];
  
  // Define os valores iniciais
  nativeLangBubble.textContent = nativeLang.flag;
  nativeLangBubble.title = `Idioma nativo: ${nativeLang.name}`;
  
  // Inicia com o idioma nativo selecionado
  let currentLang = nativeLang;
  selectedLangBubble.textContent = '🌐';
  selectedLangBubble.title = 'Selecionar idioma';

  // Menu de seleção de idiomas
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

  // Adiciona os idiomas ao menu (exceto o nativo)
  languages.forEach(lang => {
    if (lang.code !== nativeLang.code) {
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

  // Controle do menu - abre ao clicar no balão selecionado
  selectedLangBubble.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = selectedLangBubble.getBoundingClientRect();
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
    recognition.lang = nativeLang.code;

    // Exibe mensagem inicial
    textDisplay.textContent = `${nativeLang.flag} ${nativeLang.speakText}...`;

    // Seleção de idioma
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        const selectedLang = languages.find(l => l.code === langCode);
        
        // Atualiza o balão selecionado (substitui o 🌐)
        selectedLangBubble.textContent = selectedLang.flag;
        selectedLangBubble.title = `Idioma selecionado: ${selectedLang.name}`;
        
        // Atualiza o idioma atual
        currentLang = selectedLang;
        
        // Configura o reconhecimento de voz
        recognition.stop();
        recognition.lang = langCode;
        textDisplay.textContent = `${selectedLang.flag} ${selectedLang.speakText}...`;
        
        setTimeout(() => recognition.start(), 300);
        languageMenu.style.display = 'none';
      }
    });

    // Botão para resetar ao idioma nativo
    nativeLangBubble.addEventListener('dblclick', () => {
      currentLang = nativeLang;
      selectedLangBubble.textContent = '🌐';
      selectedLangBubble.title = 'Selecionar idioma';
      
      recognition.stop();
      recognition.lang = nativeLang.code;
      textDisplay.textContent = `${nativeLang.flag} ${nativeLang.speakText}...`;
      
      setTimeout(() => recognition.start(), 300);
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
      
      if (event.error === 'no-speech') {
        textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;
        recognition.start();
      } else if (event.error === 'audio-capture') {
        textDisplay.textContent = 'Microfone não detectado';
      } else if (event.error === 'not-allowed') {
        textDisplay.textContent = 'Permissão para microfone negada';
      }
    };

    recognition.onend = () => {
      if (!textDisplay.textContent.includes('Permissão')) {
        recognition.start();
      }
    };

    // Inicia o reconhecimento
    setTimeout(() => recognition.start(), 1000);
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    textDisplay.style.color = 'black';
    console.error('API de reconhecimento de voz não suportada');
  }
};
