// 📦 Importação do módulo WebRTC
import WebRTCCore from '../core/webrtc-core.js';

// 🏳️ Mapeamento de idiomas para bandeiras
const LANGUAGE_FLAGS = {
  'pt': '🇧🇷',
  'en': '🇺🇸',
  'es': '🇪🇸',
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'it': '🇮🇹',
  'ja': '🇯🇵',
  'zh': '🇨🇳',
  'ru': '🇷🇺'
};

// 🚀 Inicialização ao carregar a página
window.onload = () => {
  // 🔍 Extração de parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('name') || 'Visitante';
  const userLang = urlParams.get('lang') || 'en';
  const userFlag = LANGUAGE_FLAGS[userLang] || '🌐';

  // 👤 Exibição das informações do usuário
  const userInfoDisplay = document.createElement('div');
  userInfoDisplay.className = 'user-info';
  userInfoDisplay.innerHTML = `${userName} ${userFlag}`;
  document.body.appendChild(userInfoDisplay);

  // --------------------------------------------
  // 🔧 TUDO ABAIXO DISTO PERMANECE EXATAMENTE IGUAL
  // --------------------------------------------

  // 📡 Inicialização do WebRTC
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // 🎥 Referência aos elementos de vídeo
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = null;
  let localStream = null;

  // 📷 Solicitação de acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // 🔗 Verificação de ID na URL
  const targetIdFromUrl = urlParams.get('targetId');
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // 📞 Configuração do botão de chamada
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // 🔇 Silenciamento do áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
