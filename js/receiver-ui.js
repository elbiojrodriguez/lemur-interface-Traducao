import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);

  let localStream = null;

  // 🔓 Solicita acesso à câmera logo na abertura, mas NÃO exibe
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      // Não atribuímos ao localVideo aqui
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Gera URL completa para o caller com o ID como parâmetro
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Stream local não disponível");
      return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // 🔇 Silencia qualquer áudio recebido
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);
      localVideo.srcObject = remoteStream; // Aqui sim mostramos a câmera do caller
    });
  };
};
