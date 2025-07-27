import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore('https://lemur-signal.onrender.com');
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const pipContainer = document.querySelector('.local-pip');
  const transcriptionEl = document.getElementById('transcription');
  const micBtn = document.getElementById('offBtn');

  // Configuração do reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'pt-BR';

  let isListening = false;

  // Eventos do reconhecimento de voz
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    transcriptionEl.textContent = finalTranscript || interimTranscript;
  };

  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
  };

  // Controle do botão do microfone
  micBtn.onmousedown = micBtn.ontouchstart = () => {
    try {
      recognition.start();
      isListening = true;
      micBtn.innerHTML = '<i class="material-icons">mic_off</i>';
      micBtn.style.backgroundColor = '#4CAF50';
      transcriptionEl.textContent = 'Ouvindo...';
    } catch (e) {
      console.error('Erro ao iniciar reconhecimento:', e);
    }
  };

  micBtn.onmouseup = micBtn.ontouchend = () => {
    if (isListening) {
      recognition.stop();
      isListening = false;
      micBtn.innerHTML = '<i class="material-icons">mic</i>';
      micBtn.style.backgroundColor = '#ff4444';
    }
  };

  // Fechar janela com clique duplo
  micBtn.ondblclick = () => {
    window.close();
  };

  // Restante do código WebRTC
  navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'user' }, 
    audio: true 
  }).then(stream => {
    localVideo.srcObject = stream;
    localVideo.style.display = 'none';

    document.getElementById('callActionBtn').onclick = () => {
      const targetId = prompt('Digite o ID do destinatário');
      if (targetId) {
        rtcCore.startCall(targetId.trim(), stream);
      }
    };
  }).catch(err => {
    console.error('Erro ao acessar câmera:', err);
  });

  rtcCore.setRemoteStreamCallback(stream => {
    const pipVideo = pipContainer.querySelector('video') || document.createElement('video');
    pipVideo.srcObject = stream;
    pipVideo.autoplay = true;
    pipVideo.playsinline = true;
    pipVideo.style.display = 'block';
    pipVideo.style.width = '100%';
    pipVideo.style.height = '100%';
    pipVideo.style.objectFit = 'cover';
    
    if (!pipContainer.contains(pipVideo)) {
      pipContainer.innerHTML = '';
      pipContainer.appendChild(pipVideo);
    }
  });
};
