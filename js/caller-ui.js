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

  // 🔍 Verifica se há ID na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');

  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // 🔓 Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;

      // ✅ Só ativa o botão depois que o stream estiver pronto
      document.getElementById('callActionBtn').onclick = () => {
        if (!targetId || !localStream) {
          console.warn("targetId ou localStream ausente.");
          return;
        }
        rtcCore.startCall(targetId, localStream);
      };
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // 🔇 Silencia qualquer áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
