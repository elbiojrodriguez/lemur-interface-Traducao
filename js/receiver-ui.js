import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // Gera URL completa para o caller com o ID como parâmetro
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);
  
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  
  rtcCore.onIncomingCall = (offer) => {
    // 🔇 Captura apenas vídeo, sem áudio
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        localVideo.srcObject = stream;
        rtcCore.handleIncomingCall(offer, stream, (remoteStream) => {
          // 🔇 Silencia qualquer áudio recebido
          remoteStream.getAudioTracks().forEach(track => track.enabled = false);
          localVideo.srcObject = remoteStream;
        });
      });
  };
};
