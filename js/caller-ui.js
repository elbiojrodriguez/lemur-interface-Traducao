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

  // Language buttons
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(button => {
    button.onclick = () => {
      const lang = button.dataset.lang;
      startSpeechRecognition(lang);
    };
  });

  // Language selector
  const languageSelector = document.getElementById('languageSelector');
  languageSelector.onchange = () => {
    const selectedLang = languageSelector.value;
    startSpeechRecognition(selectedLang);
  };

  // Auto-detect language button
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

  // Stop button
  const stopBtn = document.getElementById('stopBtn');
  stopBtn.onclick = () => {
    stopRequested = true;
    if (recognition) recognition.stop();
  };

  // Optimized speech recognition function for Android/Chrome
  function startSpeechRecognition(language) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      chatBox.textContent = "Reconhecimento não suportado";
      return;
    }

    // Mobile-optimized configuration
    recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1; // Critical for Android!

    // State variables
    let finalTranscript = '';
    let lastStableResult = '';
    let isFinalizing = false;
    let androidDebounce = null;

    stopRequested = false;
    chatBox.textContent = `🎤 Ouvindo (${language})...`;

    recognition.onresult = (event) => {
      clearTimeout(androidDebounce);
      
      let interim = '';
      let newFinal = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinal += result[0].transcript.trim();
          isFinalizing = true;
        } else if (!isFinalizing) {
          interim = result[0].transcript.trim();
        }
      }

      // Android-specific logic
      androidDebounce = setTimeout(() => {
        if (newFinal) {
          // Only update if different from last stable result
          if (newFinal !== lastStableResult) {
            finalTranscript += newFinal + '\n🔄\n';
            lastStableResult = newFinal;
            chatBox.textContent = finalTranscript;
          }
          isFinalizing = false;
        } else if (interim) {
          // Interim update only occurs after 1s without finals
          chatBox.textContent = finalTranscript + '🔄 ' + interim;
        }
      }, isFinalizing ? 0 : 1000); // Longer delay for interim results
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') { // Ignore silence errors
        chatBox.textContent += `\n[ERRO: ${event.error}]`;
      }
    };

    recognition.onend = () => {
      if (!stopRequested) {
        recognition.start(); // Auto-restart
      } else {
        chatBox.textContent += "\n🛑 Fala encerrada manualmente.";
      }
    };

    recognition.start();
  }
};
