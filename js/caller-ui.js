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
  let lastStableResult = '';
  let isFinalizing = false;
  let androidDebounce = null;

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
      chatBox.textContent = "Reconhecimento não suportado";
      return;
    }

    // Configuração mobile-otimizada
    recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1; // Critical para Android!

    // Variáveis de estado
    let finalTranscript = '';
    lastStableResult = '';
    isFinalizing = false;
    stopRequested = false;
    chatBox.textContent = `🎤 Ouvindo (${language})...`;

    recognition.onresult = (event) => {
      clearTimeout(androidDebounce);
      
      let interim = '';
      let newFinal = '';

      // Processa todos os resultados
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinal += result[0].transcript.trim();
          isFinalizing = true;
        } else if (!isFinalizing) {
          interim = result[0].transcript.trim();
        }
      }

      // Lógica específica para Android
      androidDebounce = setTimeout(() => {
        if (newFinal) {
          // Só atualiza se for diferente do último resultado estável
          if (newFinal !== lastStableResult) {
            finalTranscript += newFinal + '\n🔄\n';
            lastStableResult = newFinal;
            chatBox.textContent = finalTranscript;
          }
          isFinalizing = false;
        } else if (interim) {
          // Atualização intermediária só ocorre após 1s sem finais
          chatBox.textContent = finalTranscript + '🔄 ' + interim;
        }
      }, isFinalizing ? 0 : 1000); // Delay maior para interims
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') { // Ignora erros de silêncio
        chatBox.textContent += `\n[ERRO: ${event.error}]`;
      }
    };

    recognition.onend = () => !stopRequested && recognition.start();
    recognition.start();
  }
};
