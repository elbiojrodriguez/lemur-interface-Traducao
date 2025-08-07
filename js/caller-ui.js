import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

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

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

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

  let currentLang = languages.find(lang => navigator.language.startsWith(lang.code.split('-')[0])) || languages[1];

  const currentLangBubble = document.getElementById('currentLangBubble');
  const langSelectorBtn = document.getElementById('langSelectorBtn');
  const languageMenu = document.getElementById('languageMenu');

  function updateCurrentLangDisplay() {
    currentLangBubble.textContent = currentLang.flag;
    currentLangBubble.title = `Idioma atual: ${currentLang.name}`;
    textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;
  }

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLang.code;

    updateCurrentLangDisplay();

    // Preenche o menu com os idiomas
    languages.forEach(lang => {
      const langBtn = document.createElement('button');
      langBtn.className = 'lang-option';
      langBtn.innerHTML = `${lang.flag}`;
      langBtn.dataset.langCode = lang.code;
      langBtn.dataset.speakText = lang.speakText;
      langBtn.title = lang.name;

      langBtn.addEventListener('click', () => {
        currentLang = lang;
        recognition.stop();
        recognition.lang = lang.code;
        updateCurrentLangDisplay();
        setTimeout(() => recognition.start(), 300);
        languageMenu.style.display = 'none';
      });

      languageMenu.appendChild(langBtn);
    });

    // Abre o menu ao clicar no 🌐
    langSelectButton.addEventListener('click', (e) => {
  e.stopPropagation();
  languageMenu.style.display = 'block';

  setTimeout(() => {
    const rect = langSelectButton.getBoundingClientRect();
    const menuHeight = languageMenu.offsetHeight;

    languageMenu.style.left = `${rect.left}px`;
    languageMenu.style.top = `${rect.top - menuHeight - 10}px`;
  }, 0);
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
