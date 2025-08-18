import WebRTCCore from '../core/webrtc-core.js';

// Mapeamento de idiomas para bandeiras (adicionado no topo)
const LANGUAGE_FLAGS = {
  'pt': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸', 
  'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
  'ja': '🇯🇵', 'zh': '🇨🇳', 'ru': '🇷🇺'
};

window.onload = () => {
  // Extrai parâmetros da URL (adicionado antes de qualquer lógica)
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('name') || 'Visitante';
  const userLang = urlParams.get('lang') || 'en';
  const userFlag = LANGUAGE_FLAGS[userLang] || '🌐';

  // Exibe as informações do usuário (nova adição)
  const userInfoDisplay = document.createElement('div');
  userInfoDisplay.className = 'user-info';
  userInfoDisplay.innerHTML = `${userName} ${userFlag}`;
  document.body.appendChild(userInfoDisplay);

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
};
