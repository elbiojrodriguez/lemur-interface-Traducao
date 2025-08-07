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

  const languages = {
    'pt-BR': { flag: '🇧🇷', speakText: 'Fale agora', name: 'Português' },
    'es-ES': { flag: '🇪🇸', speakText: 'Habla ahora', name: 'Español' }
  };

  let currentLangCode = 'pt-BR';
  let currentLang = languages[currentLangCode];

  const currentLangBubble = document.getElementById('currentLangBubble');
  const langSelectorBtn = document.getElementById('langSelectorBtn');

  function updateCurrentLangBubble() {
    currentLangBubble.textContent = currentLang.flag;
    currentLangBubble.title = `Idioma atual: ${currentLang.name}`;
    textDisplay.textContent = `${currentLang.flag} ${currentLang.speakText}...`;
  }

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLangCode;

    updateCurrentLangBubble();

    langSelectorBtn.addEventListener('click', () => {
      // Alterna entre pt-BR e es-ES
      currentLangCode = currentLangCode === 'pt-BR' ? 'es-ES' : 'pt-BR';
      currentLang = languages[currentLangCode];

      recognition.stop();
      recognition.lang = currentLangCode;
      updateCurrentLangBubble();
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
    };

    setTimeout(() => recognition.start(), 1000);
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    textDisplay.style.color = 'black';
    console.error('API de reconhecimento de voz não suportada');
  }
};
