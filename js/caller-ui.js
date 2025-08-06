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

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica ID na URL
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

  // Silencia áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });

  // #############################################
  // IMPLEMENTAÇÃO DO RECONHECIMENTO DE VOZ COM MODAL
  // #############################################

  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.style.padding = '10px';
  textDisplay.style.color = 'black';
  textDisplay.style.textAlign = 'center';
  textDisplay.style.height = '100%';
  textDisplay.style.display = 'flex';
  textDisplay.style.alignItems = 'center';
  textDisplay.style.justifyContent = 'center';
  textDisplay.style.wordBreak = 'break-word';
  textDisplay.style.overflowY = 'auto';
  chatBox.appendChild(textDisplay);

  // Cria o modal de seleção de idiomas
  const languageModal = document.createElement('div');
  languageModal.id = 'languageModal';
  languageModal.style.display = 'none';
  languageModal.style.position = 'fixed';
  languageModal.style.top = '0';
  languageModal.style.left = '0';
  languageModal.style.width = '100%';
  languageModal.style.height = '100%';
  languageModal.style.backgroundColor = 'rgba(0,0,0,0.6)';
  languageModal.style.zIndex = '999';
  languageModal.style.justifyContent = 'center';
  languageModal.style.alignItems = 'center';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.style.backgroundColor = 'white';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.maxWidth = '400px';
  modalContent.style.width = '90%';
  modalContent.style.textAlign = 'center';

  const modalTitle = document.createElement('h2');
  modalTitle.textContent = 'Escolha seu idioma:';
  modalContent.appendChild(modalTitle);

  const languageSelector = document.createElement('select');
  languageSelector.id = 'languageSelector';
  languageSelector.style.width = '100%';
  languageSelector.style.padding = '10px';
  languageSelector.style.fontSize = '16px';
  languageSelector.style.margin = '10px 0';

  // Opções de idiomas
  const languages = [
    { value: 'en-US', label: '🇺🇸 Inglês (EUA)', flag: '🇺🇸' },
    { value: 'en-GB', label: '🇬🇧 Inglês (UK)', flag: '🇬🇧' },
    { value: 'pt-BR', label: '🇧🇷 Português (BR)', flag: '🇧🇷' },
    { value: 'es-ES', label: '🇪🇸 Espanhol', flag: '🇪🇸' },
    { value: 'fr-FR', label: '🇫🇷 Francês', flag: '🇫🇷' },
    { value: 'de-DE', label: '🇩🇪 Alemão', flag: '🇩🇪' },
    { value: 'it-IT', label: '🇮🇹 Italiano', flag: '🇮🇹' },
    { value: 'ja-JP', label: '.', flag: '🇯🇵' },
    { value: 'zh-CN', label: '🇨🇳 Chinês', flag: '🇨🇳' },
    { value: 'ru-RU', label: '🇷🇺 Russo', flag: '🇷🇺' },
    { value: 'ko-KR', label: '🇰🇷 Coreano', flag: '🇰🇷' },
    { value: 'ar-SA', label: '🇸🇦 Árabe', flag: '🇸🇦' }
  ];

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '— Selecione —';
  defaultOption.selected = true;
  defaultOption.disabled = true;
  languageSelector.appendChild(defaultOption);

  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.value;
    option.textContent = lang.label;
    option.dataset.flag = lang.flag;
    languageSelector.appendChild(option);
  });

  modalContent.appendChild(languageSelector);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = 'Fechar';
  closeBtn.style.marginTop = '15px';
  closeBtn.style.backgroundColor = '#0078D7';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.padding = '10px 20px';
  closeBtn.style.borderRadius = '6px';
  closeBtn.style.cursor = 'pointer';
  modalContent.appendChild(closeBtn);

  languageModal.appendChild(modalContent);
  document.body.appendChild(languageModal);

  // Cria o botão da ONU
  const languageButton = document.createElement('button');
  languageButton.id = 'languageButton';
  languageButton.textContent = '🌐';
  languageButton.title = 'Selecionar idioma';
  languageButton.style.background = 'none';
  languageButton.style.border = 'none';
  languageButton.style.cursor = 'pointer';
  languageButton.style.fontSize = '40px';
  languageButton.style.position = 'absolute';
  languageButton.style.bottom = '20px';
  languageButton.style.right = '20px';
  languageButton.style.zIndex = '100';

  // Adiciona o botão ao container de controles
  document.querySelector('.controls').appendChild(languageButton);

  // Event listeners para o modal
  languageButton.addEventListener('click', () => {
    languageModal.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => {
    languageModal.style.display = 'none';
  });

  // Configura o reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    languageSelector.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (!selectedOption.value) return;

      const langCode = selectedOption.value;
      const flag = selectedOption.dataset.flag;
      
      // Fecha o modal
      languageModal.style.display = 'none';
      
      // Configura e inicia o reconhecimento de voz
      if (recognition) {
        recognition.stop();
        recognition.lang = langCode;
        textDisplay.textContent = `Fale agora (${flag})...`;
        
        setTimeout(() => {
          recognition.start();
        }, 300);
      }
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
    };
  } else {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    console.error('API de reconhecimento de voz não suportada neste navegador');
  }
};
