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

  // 🔓 Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica se há ID na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Configura o botão de chamada
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // 🔇 Silencia qualquer áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });

  // #############################################
  // IMPLEMENTAÇÃO DO RECONHECIMENTO DE VOZ
  // #############################################

  // Elemento para mostrar o texto transcrito
  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.style.padding = '10px';
  textDisplay.style.color = 'blak';
  textDisplay.style.textAlign = 'center';
  textDisplay.style.height = '100%';
  textDisplay.style.display = 'flex';
  textDisplay.style.alignItems = 'center';
  textDisplay.style.justifyContent = 'center';
  textDisplay.style.wordBreak = 'break-word';
  textDisplay.style.overflowY = 'auto';
  chatBox.appendChild(textDisplay);

  // Verifica suporte ao reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    console.error('API de reconhecimento de voz não suportada neste navegador');
  } else {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Mapeamento de idiomas
    const languageMap = {
      '🇬🇧': 'en-US',
      '🇧🇷': 'pt-BR',
      '🇪🇸': 'es-ES'
    };

    // Configura os botões de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const langCode = languageMap[btn.textContent];
        if (langCode) {
          // Para qualquer reconhecimento em andamento
          recognition.stop();
          
          // Configura o novo idioma
          recognition.lang = langCode;
          
          // Limpa o texto anterior
          textDisplay.textContent = 'Fale agora...';
          
          // Inicia o reconhecimento
          setTimeout(() => {
            recognition.start();
          }, 300);
          
          console.log(`Reconhecimento iniciado para ${langCode}`);
        }
      });
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

      // Mostra resultados temporários e finais
      textDisplay.innerHTML = finalTranscript + '<i>' + interimTranscript + '</i>';
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      if (event.error === 'no-speech') {
        textDisplay.textContent = 'Nenhuma fala detectada. Tente novamente.';
      } else if (event.error === 'audio-capture') {
        textDisplay.textContent = 'Microfone não encontrado. Verifique suas permissões.';
      } else if (event.error === 'not-allowed') {
        textDisplay.textContent = 'Permissão para usar o microfone foi negada.';
      }
    };

    recognition.onend = () => {
      console.log('Reconhecimento de voz encerrado');
      // Pode reiniciar automaticamente se desejar
      // recognition.start();
    };
  }
};
