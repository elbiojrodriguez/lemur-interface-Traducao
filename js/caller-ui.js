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

  const chatBox = document.getElementById('chatBox');

  // 🔻 Botões de bandeiras
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(button => {
    button.onclick = () => {
      const lang = button.dataset.lang;
      startSpeechRecognition(lang);
    };
  });

  // 🔻 Seletor completo
  const languageSelector = document.getElementById('languageSelector');
  languageSelector.onchange = () => {
    const selectedLang = languageSelector.value;
    startSpeechRecognition(selectedLang);
  };

  // 🔻 Botão automático com idioma do dispositivo
  const userLang = navigator.language || 'en-US';
  const flagMap = {
    'pt-BR': '🇧🇷',
    'en-US': '🇺🇸',
    'en-GB': '🇬🇧',
    'es-ES': '🇪🇸',
    'fr-FR': '🇫🇷',
    'de-DE': '🇩🇪',
    'it-IT': '🇮🇹',
    'ja-JP': '🇯🇵',
    'zh-CN': '🇨🇳',
    'ru-RU': '🇷🇺',
    'ko-KR': '🇰🇷',
    'ar-SA': '🇸🇦'
  };

  const flag = flagMap[userLang] || '🌐';
  const autoBtn = document.createElement('button');
  autoBtn.innerHTML = `${flag} Falar (${userLang}) 🎤`;
  autoBtn.onclick = () => startSpeechRecognition(userLang);
  document.getElementById('autoLangContainer').appendChild(autoBtn);

  // 🔻 Função de reconhecimento de voz
  function startSpeechRecognition(language) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    chatBox.textContent = "Reconhecimento de voz não suportado neste navegador.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (result.isFinal) {
        transcript += result[0].transcript;
      }
    }

    if (transcript.trim()) {
      const phraseBox = document.createElement('div');
      phraseBox.textContent = transcript;
      phraseBox.className = 'phrase-box';
      chatBox.appendChild(phraseBox);
    }
  };

  recognition.onerror = (event) => {
    const errorBox = document.createElement('div');
    errorBox.textContent = "Erro: " + event.error;
    errorBox.className = 'phrase-box';
    chatBox.appendChild(errorBox);
  };

  recognition.onend = () => {
    recognition.start(); // Reinicia automaticamente após pausa
  };

  recognition.start();
    }
};
