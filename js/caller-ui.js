import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeScanner } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = null;

  // Verifica se há ID na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Configura o scanner de QR Code
  document.getElementById('scanBtn').onclick = () => {
    QRCodeScanner.start('reader', (decodedUrl) => {
      try {
        const url = new URL(decodedUrl);
        if (url.pathname.endsWith('/caller.html')) {
          targetId = url.searchParams.get('targetId');
          if (targetId) {
            document.getElementById('callActionBtn').style.display = 'block';
          }
        }
      } catch (e) {
        console.error("QR Code inválido:", e);
      }
      });
  };

  // Configura o botão de chamada
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId) return;
    
    // 🔇 Captura apenas vídeo, sem áudio
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        remoteVideo.srcObject = stream;
        rtcCore.startCall(targetId, stream);
      });
  };

  // 🔇 Silencia qualquer áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
