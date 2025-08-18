import WebRTCCore from '../core/webrtc-core.js';

// ✅ Função para obter bandeira via API
async function getFlagEmoji(lang) {
  try {
    const response = await fetch(`https://language-flags.fly.dev/${lang}`);
    return await response.text(); // Retorna emoji (ex: 🇧🇷)
  } catch {
    return '🌐'; // Fallback se falhar
  }
}

// ✅ Função para normalizar o código do idioma
function normalizeLangCode(lang) {
  return lang?.split('-')[0]?.toLowerCase() || 'en';
}

window.onload = async () => {
  // Extrai parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('name') || 'Visitante';
  const rawLang = urlParams.get('lang') || navigator.language || 'en';
  const userLang = normalizeLangCode(rawLang);
  const userFlag = await getFlagEmoji(userLang); // ✅ Bandeira dinâmica

  // Exibe as informações do usuário
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
