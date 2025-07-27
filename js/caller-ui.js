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

  // Verifica se o navegador suporta reconhecimento de voz
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('API de reconhecimento de voz não suportada');
    micBtn.innerHTML = '<i class="material-icons">mic_off</i>';
    micBtn.title = 'Reconhecimento de voz não suportado';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'pt-BR';

  let isListening = false;
  let finalTranscript = '';
  let timeoutId;

  recognition.onresult = (event) => {
    clearTimeout(timeoutId);
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Mostra o texto transcrito
    transcriptionEl.textContent = finalTranscript + interimTranscript;
    transcriptionEl.style.display = 'block';

    // Reseta o temporizador quando há atividade
    timeoutId = setTimeout(() => {
      transcriptionEl.style.display = 'none';
      finalTranscript = '';
    }, 5000);
  };

  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento:', event.error);
    transcriptionEl.textContent = 'Erro ao ouvir. Tente novamente.';
    resetMicButton();
  };

  recognition.onend = () => {
    if (isListening) {
      // Reconecta automaticamente se ainda estiver no modo de escuta
      recognition.start();
    }
  };

  const resetMicButton = () => {
    isListening = false;
    micBtn.innerHTML = '<i class="material-icons">mic</i>';
    micBtn.style.backgroundColor = '#ff4444';
  };

  // Eventos de toque/pressionar
  micBtn.addEventListener('mousedown', startListening);
  micBtn.addEventListener('touchstart', startListening, { passive: true });
  
  micBtn.addEventListener('mouseup', stopListening);
  micBtn.addEventListener('touchend', stopListening);
  micBtn.addEventListener('mouseleave', stopListening);

  function startListening(e) {
    e.preventDefault();
    try {
      recognition.start();
      isListening = true;
      micBtn.innerHTML = '<i class="material-icons">mic_off</i>';
      micBtn.style.backgroundColor = '#4CAF50';
      transcriptionEl.textContent = 'Ouvindo...';
      transcriptionEl.style.display = 'block';
    } catch (err) {
      console.error('Erro ao iniciar microfone:', err);
      transcriptionEl.textContent = 'Erro ao acessar microfone';
    }
  }

  function stopListening() {
    if (isListening) {
      recognition.stop();
      resetMicButton();
    }
  }

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
