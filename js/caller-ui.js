import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');

  // Obtém o ID do destinatário pela URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('targetId');

  if (!targetId) return;

  // Captura apenas vídeo (sem áudio)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      remoteVideo.srcObject = stream;
      rtcCore.startCall(targetId, stream);
    });

  // Recebe o vídeo remoto e silencia qualquer áudio
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
