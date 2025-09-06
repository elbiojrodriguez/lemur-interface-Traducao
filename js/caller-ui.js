import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();

  // Gera e exibe o ID do usuário
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;

  // Inicializa WebRTC e socket
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // Mantemos apenas o vídeo remoto — é onde o visitante será exibido
  const remoteVideo = document.getElementById('remoteVideo');

  let targetId = null;
  let localStream = null;

  // Captura da câmera local (sem exibição)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      // Não exibimos localmente — apenas transmitimos
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica se há ID de destino na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');

  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Inicia a chamada quando o botão é clicado
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // Quando o visitante envia vídeo, exibimos no box remoto
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    remoteVideo.srcObject = stream;
  });
};
