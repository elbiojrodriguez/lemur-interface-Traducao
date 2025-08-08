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
  let stopRequested = false;
  let recognition = null;
  let lastFinalTranscript = '';
  let debounceTimer;

  // 🔻 Botões de bandeiras
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(button => {
    button.onclick = () => {
      const lang = button.dataset.lang;
      startSpeechRecognition(lang);
    };
  });

  // 🔻 Seletor de idioma
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

  // 🔻 Botão de parar
  const stopBtn = document.getElementById('stopBtn');
  stopBtn.onclick = () => {
    stopRequested = true;
    if (recognition) recognition.stop();
  };

  // 🔻 Função de reconhecimento de voz (ATUALIZADA)
function startSpeechRecognition(language) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    chatBox.textContent = "Reconhecimento de voz não suportado neste navegador.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  stopRequested = false;
  let finalTranscript = '';
  let lastFinalTranscript = '';
  let debounceTimer;
  let lastInterim = '';

  chatBox.textContent = `🎤 Ouvindo (${language})...`;

  recognition.onresult = (event) => {
    clearTimeout(debounceTimer);
    
    let interimTranscript = '';
    let newFinalParts = [];

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();

      if (result.isFinal) {
        newFinalParts.push(transcript);
      } else {
        interimTranscript = transcript;
      }
    }

    // Junta todas as partes finalizadas desde o último evento
    if (newFinalParts.length > 0) {
      const newFinalText = newFinalParts.join(' ');
      if (newFinalText !== lastFinalTranscript) {
        finalTranscript += newFinalText + '\n🔄\n';
        lastFinalTranscript = newFinalText;
        lastInterim = ''; // Reseta o interim quando temos novo final
      }
    }

    // Atualiza apenas se o interim mudou significativamente
    if (interimTranscript && interimTranscript !== lastInterim) {
      lastInterim = interimTranscript;
    }

    // Debounce para evitar flickering
    debounceTimer = setTimeout(() => {
      chatBox.textContent = finalTranscript + 
        (lastInterim ? '🔄 ' + lastInterim : '');
    }, 200);
  };

  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento:', event.error);
    chatBox.textContent += `\n❌ Erro: ${event.error}`;
  };

  recognition.onend = () => {
    if (!stopRequested) {
      recognition.start();
    } else {
      chatBox.textContent += "\n🛑 Fala encerrada manualmente.";
    }
  };

  recognition.start();
}
