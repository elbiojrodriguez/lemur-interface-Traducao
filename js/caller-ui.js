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
  // IMPLEMENTAÇÃO DO RECONHECIMENTO DE VOZ
  // #############################################

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

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    textDisplay.textContent = 'Seu navegador não suporta reconhecimento de voz';
    console.error('API de reconhecimento de voz não suportada');
  } else {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Mapeamento completo de idiomas
    const languageMap = {
      'en': { code: 'en-US', flag: '🇬🇧' },
      'pt': { code: 'pt-BR', flag: '🇧🇷' },
      'es': { code: 'es-ES', flag: '🇪🇸' },
      'fr': { code: 'fr-FR', flag: '🇫🇷' },
      'de': { code: 'de-DE', flag: '🇩🇪' },
      'it': { code: 'it-IT', flag: '🇮🇹' },
      'ja': { code: 'ja-JP', flag: '🇯🇵' },
      'zh': { code: 'zh-CN', flag: '🇨🇳' },
      'ru': { code: 'ru-RU', flag: '🇷🇺' }
    };

    // Detecta o idioma do navegador
    const browserLanguage = navigator.language.split('-')[0];
    const detectedLanguage = languageMap[browserLanguage] || languageMap['en'];

    // Cria botão dinâmico com o idioma detectado
    const langButtonsContainer = document.querySelector('.language-bubbles');
    const autoLangBtn = document.createElement('button');
    autoLangBtn.className = 'lang-btn';
    autoLangBtn.textContent = detectedLanguage.flag;
    autoLangBtn.title = `Idioma detectado: ${browserLanguage}`;
    
    // Insere o botão antes do botão do Brasil (segundo botão)
    if (langButtonsContainer.children.length > 1) {
      langButtonsContainer.insertBefore(autoLangBtn, langButtonsContainer.children[1]);
    } else {
      langButtonsContainer.appendChild(autoLangBtn);
    }

    // Configura todos os botões de idioma (incluindo o novo)
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        let langCode, flag;
        
        // Verifica se é o botão automático
        if (this === autoLangBtn) {
          langCode = detectedLanguage.code;
          flag = detectedLanguage.flag;
        } else {
          // Para os botões fixos, encontra o idioma correspondente
          const langEntry = Object.entries(languageMap).find(
            ([_, data]) => data.flag === this.textContent
          );
          if (langEntry) {
            langCode = langEntry[1].code;
            flag = langEntry[1].flag;
          }
        }

        if (langCode) {
          recognition.stop();
          recognition.lang = langCode;
          textDisplay.textContent = `Fale agora (${flag})...`;
          
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

      textDisplay.innerHTML = finalTranscript + '<i>' + interimTranscript + '</i>';
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      if (event.error === 'no-speech') {
        textDisplay.textContent = 'Nenhuma fala detectada. Tente novamente.';
      }
    };

    recognition.onend = () => {
      console.log('Reconhecimento de voz encerrado');
    };
  }
};
