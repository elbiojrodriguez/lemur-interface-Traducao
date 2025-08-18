import WebRTCCore from '../core/webrtc-core.js';

// Mapeamento completo de idiomas e regiões para bandeiras
const LANGUAGE_FLAGS = {
  // Português
  'pt-BR': '🇧🇷',
  'pt-PT': '🇵🇹',
  
  // Inglês
  'en': '🇺🇸',
  'en-US': '🇺🇸',
  'en-GB': '🇬🇧',
  
  // Espanhol
  'es': '🇪🇸',
  'es-ES': '🇪🇸',
  'es-MX': '🇲🇽',
  
  // Outros idiomas
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'it': '🇮🇹',
  'ja': '🇯🇵',
  'zh': '🇨🇳',
  'ru': '🇷🇺'
};

window.onload = () => {
  // Extrai parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('name') || 'Visitante';
  const userLang = urlParams.get('lang') || 'en';
  
  // Lógica aprimorada para bandeiras (verifica primeiro a versão com região)
  const userFlag = LANGUAGE_FLAGS[userLang] || 
                  LANGUAGE_FLAGS[userLang.split('-')[0]] || 
                  '🌐';

  // Exibe as informações do usuário
  const userInfoDisplay = document.getElementById('userInfoDisplay');
  if (userInfoDisplay) {
    userInfoDisplay.textContent = `${userName} ${userFlag}`;
    userInfoDisplay.style.display = 'flex';
  }

  // --------------------------------------------
  // TUDO ABAIXO DISTO PERMANECE EXATAMENTE IGUAL
  // --------------------------------------------
  
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

  // Verifica se há ID na URL
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
