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
  const langButtons = document.querySelectorAll('.lang-btn');

  langButtons.forEach(button => {
    button.onclick = () => {
      const lang = button.dataset.lang;
      startSpeechRecognition(lang);
    };
  });

  // 🔻 Seletor manual
  const manualSelect = document.getElementById('manualLang');
  manualSelect.onchange = () => {
    const selectedLang = manualSelect.value;
    startSpeechRecognition(selectedLang);
  };

  // 🔻 Detecção automática do idioma do navegador
  const userLang = navigator.language || 'en-US';
  const autoLangContainer = document.getElementById('autoLangContainer');

  const langMap = {
    'pt-BR': '🇧🇷',
    'en-US': '🇬🇧',
    'es-ES': '🇪🇸',
    'fr-FR': '🇫🇷',
    'de-DE': '🇩🇪',
    'ru-RU': '🇷🇺',
    'ja-JP': '🇯🇵',
    'zh-CN': '🇨🇳'
  };

  const flag = langMap[userLang] || '🌐';

  const autoBtn = document.createElement('button');
  autoBtn.innerHTML = `${flag} 🎤`;
  autoBtn.onclick = () => startSpeechRecognition(userLang);
  autoLangContainer.appendChild(autoBtn);

  function startSpeechRecognition(language) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      chatBox.textContent = "Reconhecimento de voz não suportado neste navegador.";
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;

    chatBox.textContent = "🎤 Ouvindo...";

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      chatBox.textContent = transcript;
    };

    recognition.onerror = (event) => {
      chatBox.textContent = "Erro: " + event.error;
    };

    recognition.onend = () => {
      chatBox.textContent += "\n✅ Fala encerrada.";
    };

    recognition.start();
  }
};
