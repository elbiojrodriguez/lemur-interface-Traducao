import WebRTCCore from '../core/webrtc-core.js';

window.onload = async () => {
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

  // Configuração inicial do ícone
  micBtn.innerHTML = '<i class="material-icons mic-icon mic-off">mic</i>';
  
  // Verificação de suporte
  if (!('webkitSpeechRecognition' in window)) {
    console.error('API de voz não suportada');
    transcriptionEl.textContent = "Seu navegador não suporta reconhecimento de voz";
    return;
  }

  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'pt-BR';

  let isListening = false;

  // Função para mostrar o texto transcrito
  const showTranscription = (text) => {
    transcriptionEl.textContent = text;
    transcriptionEl.style.display = 'block';
  };

  // Eventos do reconhecimento de voz
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

    if (finalTranscript) {
      showTranscription(finalTranscript);
    } else if (interimTranscript) {
      showTranscription(interimTranscript);
    }
  };

  recognition.onerror = (event) => {
    console.error('Erro:', event.error);
    showTranscription('Erro ao acessar o microfone');
    stopListening();
  };

  recognition.onend = () => {
    if (isListening) {
      recognition.start(); // Reconecta se ainda estiver ativo
    }
  };

  const startListening = () => {
    try {
      recognition.start();
      isListening = true;
      micBtn.innerHTML = '<i class="material-icons mic-icon">mic</i>';
      micBtn.style.backgroundColor = '#4CAF50';
      showTranscription('Ouvindo...');
    } catch (error) {
      console.error('Erro ao iniciar:', error);
      showTranscription('Clique novamente para ativar');
    }
  };

  const stopListening = () => {
    recognition.stop();
    isListening = false;
    micBtn.innerHTML = '<i class="material-icons mic-icon mic-off">mic</i>';
    micBtn.style.backgroundColor = '#ff4444';
  };

  // Event handlers
  micBtn.addEventListener('mousedown', startListening);
  micBtn.addEventListener('touchstart', startListening);
  micBtn.addEventListener('mouseup', stopListening);
  micBtn.addEventListener('touchend', stopListening);
  micBtn.addEventListener('mouseleave', stopListening);

  // Fechar janela com clique duplo
  micBtn.ondblclick = () => window.close();

  // Restante do código WebRTC
  navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'user' }, 
    audio: true 
  }).then(stream => {
    localVideo.srcObject = stream;
    localVideo.style.display = 'none';

    document.getElementById('callActionBtn').onclick = () => {
      const targetId = prompt('Digite o ID do destinatário');
      if (targetId) rtcCore.startCall(targetId.trim(), stream);
    };
  }).catch(err => {
    console.error('Erro ao acessar câmera:', err);
  });

  rtcCore.setRemoteStreamCallback(stream => {
    const pipVideo = pipContainer.querySelector('video') || document.createElement('video');
    pipVideo.srcObject = stream;
    pipVideo.autoplay = true;
    pipVideo.playsinline = true;
    pipVideo.style.width = '100%';
    pipVideo.style.height = '100%';
    pipVideo.style.objectFit = 'cover';
    
    if (!pipContainer.contains(pipVideo)) {
      pipContainer.innerHTML = '';
      pipContainer.appendChild(pipVideo);
    }
  });
};
