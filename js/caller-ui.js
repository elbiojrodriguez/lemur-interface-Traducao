import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = null;
  let localStream = null;

  // Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // 📥 Detecta parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang') || 'pt-BR';
  const targetIdFromUrl = urlParams.get('targetId');

  // 🌐 Idiomas disponíveis com "Eu falo" traduzido
  const languages = [
    { code: 'en-US', flag: '🇺🇸', speakText: 'I speak', name: 'English' },
    { code: 'pt-BR', flag: '🇧🇷', speakText: 'Eu falo', name: 'Português' },
    { code: 'es-ES', flag: '🇪🇸', speakText: 'Yo hablo', name: 'Español' },
    { code: 'fr-FR', flag: '🇫🇷', speakText: 'Je parle', name: 'Français' },
    { code: 'de-DE', flag: '🇩🇪', speakText: 'Ich spreche', name: 'Deutsch' },
    { code: 'ja-JP', flag: '🇯🇵', speakText: '私は話します', name: '日本語' },
    { code: 'zh-CN', flag: '🇨🇳', speakText: '我说', name: '中文' },
    { code: 'ru-RU', flag: '🇷🇺', speakText: 'Я говорю', name: 'Русский' },
    { code: 'ar-SA', flag: '🇸🇦', speakText: 'أنا أتكلم', name: 'العربية' }
  ];

  // 🔍 Busca idioma correspondente
  const selectedLang = languages.find(l => l.code === lang) || languages[1]; // padrão pt-BR

  // 🖼️ Exibe frase traduzida com bandeira
  document.getElementById('languageInfo').textContent = `${selectedLang.speakText} ${selectedLang.flag}`;

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

  // Silencia qualquer áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
  
};
