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
  textDisplay.style.color = 'black';
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
      'en': { code: 'en-US', flag: '🇬🇧', name: 'Inglês' },
      'pt': { code: 'pt-BR', flag: '🇧🇷', name: 'Português' },
      'es': { code: 'es-ES', flag: '🇪🇸', name: 'Espanhol' },
      'fr': { code: 'fr-FR', flag: '🇫🇷', name: 'Francês' },
      'de': { code: 'de-DE', flag: '🇩🇪', name: 'Alemão' },
      'it': { code: 'it-IT', flag: '🇮🇹', name: 'Italiano' },
      'ja': { code: 'ja-JP', flag: '🇯🇵', name: 'Japonês' },
      'zh': { code: 'zh-CN', flag: '🇨🇳', name: 'Chinês' },
      'ko': { code: 'ko-KR', flag: '🇰🇷', name: 'Coreano' },
      'ru': { code: 'ru-RU', flag: '🇷🇺', name: 'Russo' }
    };

    // Cria o botão da ONU e menu de idiomas
    const langButtonsContainer = document.querySelector('.language-bubbles');
    const unBtn = document.createElement('button');
    unBtn.className = 'lang-btn un-btn';
    unBtn.textContent = '🇺🇳';
    unBtn.title = 'Selecionar idioma';

    const languageMenu = document.createElement('div');
    languageMenu.className = 'language-menu';

    // Adiciona os botões de idioma no menu
    Object.values(languageMap).forEach(lang => {
      const langBtn = document.createElement('button');
      langBtn.className = 'lang-option';
      langBtn.textContent = lang.flag;
      langBtn.title = lang.name;
      langBtn.dataset.langCode = lang.code;
      languageMenu.appendChild(langBtn);
    });

    // Adiciona os elementos ao DOM
    langButtonsContainer.insertBefore(unBtn, langButtonsContainer.firstChild);
    langButtonsContainer.appendChild(languageMenu);

    // Controla a abertura/fechamento do menu
    unBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      languageMenu.classList.toggle('active');
    });

    // Fecha o menu quando clicar fora
    document.addEventListener('click', (e) => {
      if (!languageMenu.contains(e.target) && e.target !== unBtn) {
        languageMenu.classList.remove('active');
      }
    });

    // Seleção de idioma
    languageMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-option') && e.target.dataset.langCode) {
        const langCode = e.target.dataset.langCode;
        const flag = e.target.textContent;
        const langName = e.target.title;
        
        // Atualiza o botão da ONU para mostrar a bandeira selecionada
        unBtn.textContent = flag;
        unBtn.title = `Idioma selecionado: ${langName}`;
        
        // Fecha o menu
        languageMenu.classList.remove('active');
        
        // Configura e inicia o reconhecimento de voz
        recognition.stop();
        recognition.lang = langCode;
        textDisplay.textContent = `Fale agora (${flag})...`;
        
        setTimeout(() => {
          recognition.start();
        }, 300);
      }
    });

    // Configura os botões de idioma originais
    document.querySelectorAll('.lang-btn:not(.un-btn)').forEach(btn => {
      btn.addEventListener('click', function() {
        const langEntry = Object.values(languageMap).find(
          lang => lang.flag === this.textContent
        );
        
        if (langEntry) {
          recognition.stop();
          recognition.lang = langEntry.code;
          textDisplay.textContent = `Fale agora (${langEntry.flag})...`;
          
          setTimeout(() => {
            recognition.start();
          }, 300);
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
      } else if (event.error === 'audio-capture') {
        textDisplay.textContent = 'Microfone não encontrado. Verifique suas permissões.';
      } else if (event.error === 'not-allowed') {
        textDisplay.textContent = 'Permissão para usar o microfone foi negada.';
      }
    };

    recognition.onend = () => {
      console.log('Reconhecimento de voz encerrado');
    };
  }
};
