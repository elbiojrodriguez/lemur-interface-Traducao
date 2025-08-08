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
  const startSpeechBtn = document.getElementById('startSpeechBtn');
  const indicator = document.getElementById('listeningIndicator');

  let recognition = null;

  // 🔻 Botão “Falar” para mobile
  startSpeechBtn.onclick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      chatBox.textContent = "Reconhecimento de voz não suportado neste navegador.";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = false; // ✅ frase por frase

    chatBox.textContent = `🎤 Ouvindo (${recognition.lang})...`;
    indicator.style.display = 'inline-block';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += '\n' + transcript + '\n';
        } else {
          interimTranscript += transcript;
        }
      }

      chatBox.textContent = finalTranscript + '\n🔄 ' + interimTranscript;
    };

    recognition.onerror = (event) => {
      chatBox.textContent += "\n❌ Erro: " + event.error;
    };

    recognition.onend = () => {
      indicator.style.display = 'none';
      chatBox.textContent += "\n⏹️ Fala encerrada.";
    };

    recognition.start();
  };
};
