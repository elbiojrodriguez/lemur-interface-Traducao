import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // [Restante do código original mantido intacto...]

  // #############################################
  // IMPLEMENTAÇÃO SIMPLIFICADA DO RECONHECIMENTO DE VOZ
  // #############################################

  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  // [Estilos do textDisplay mantidos...]
  chatBox.appendChild(textDisplay);

  // Criação do botão da ONU
  const unButton = document.createElement('button');
  unButton.className = 'lang-btn un-btn';
  unButton.textContent = '🌐';
  unButton.title = 'Selecionar idioma';
  document.querySelector('.language-bubbles').appendChild(unButton);

  // Menu de idiomas flutuante
  const languageMenu = document.createElement('div');
  languageMenu.className = 'language-menu';
  
  // Idiomas disponíveis
  const languages = [
    { code: 'en-US', flag: '🇺🇸', name: 'Inglês (EUA)' },
    { code: 'pt-BR', flag: '🇧🇷', name: 'Português (BR)' },
    { code: 'es-ES', flag: '🇪🇸', name: 'Espanhol' },
    { code: 'fr-FR', flag: '🇫🇷', name: 'Francês' },
    { code: 'de-DE', flag: '🇩🇪', name: 'Alemão' },
    { code: 'ja-JP', flag: '🇯🇵', name: 'Japonês' },
    { code: 'zh-CN', flag: '🇨🇳', name: 'Chinês' }
  ];

  // Adiciona opções de idioma ao menu
  languages.forEach(lang => {
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-option';
    langBtn.innerHTML = `${lang.flag} ${lang.name}`;
    langBtn.dataset.langCode = lang.code;
    languageMenu.appendChild(langBtn);
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
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Seleção de idioma
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option')) {
        const langCode = e.target.dataset.langCode;
        const flag = e.target.textContent.split(' ')[0];
        
        recognition.stop();
        recognition.lang = langCode;
        textDisplay.textContent = `Fale agora (${flag})...`;
        
        setTimeout(() => recognition.start(), 300);
        languageMenu.style.display = 'none';
      }
    });

    // [Manipuladores de eventos do recognition mantidos...]
  }
};
