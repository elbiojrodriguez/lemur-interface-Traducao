import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  // [Configurações iniciais permanecem iguais...]

  // #############################################
  // IMPLEMENTAÇÃO DO RECONHECIMENTO DE VOZ
  // #############################################

  // [Configuração do chatBox e textDisplay permanecem iguais...]

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

  // Idiomas disponíveis
  const languages = [
    { code: 'en-US', flag: '🇺🇸', speakText: 'Speak now', name: 'English' },
    { code: 'pt-BR', flag: '🇧🇷', speakText: 'Fale agora', name: 'Português' },
    // [...outros idiomas permanecem iguais...]
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
  // [Configuração do menu permanece igual...]

  // Adiciona os idiomas ao menu (exceto o nativo)
  languages.forEach(lang => {
    if (lang.code !== nativeLang.code) {
      const langBtn = document.createElement('button');
      // [Configuração do botão permanece igual...]
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

  // Botão para resetar ao idioma nativo (opcional)
  nativeLangBubble.addEventListener('dblclick', () => {
    currentLang = nativeLang;
    selectedLangBubble.textContent = '🌐';
    selectedLangBubble.title = 'Selecionar idioma';
    
    recognition.stop();
    recognition.lang = nativeLang.code;
    textDisplay.textContent = `${nativeLang.flag} ${nativeLang.speakText}...`;
    
    setTimeout(() => recognition.start(), 300);
  });

  // [Restante do código permanece igual...]
};
