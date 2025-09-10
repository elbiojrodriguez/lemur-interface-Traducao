import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const localVideo = document.getElementById('localVideo'); // ← usado como tela principal
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;
  let targetId = null;

  // Exibe o ID na interface
  document.getElementById('myId').textContent = myId;

  // Inicializa WebRTC
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // Captura da câmera (sem áudio)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      // Não mostramos o vídeo local — ele é usado apenas para envio
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica se há targetId na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');

  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';

    // Botão de chamada
    document.getElementById('callActionBtn').onclick = () => {
      if (localStream) {
        rtcCore.startCall(targetId, localStream);
      }
    };
  }

  // Quando receber vídeo remoto, exibe no localVideo
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream; // ← ESSENCIAL no seu projeto
  });
};
