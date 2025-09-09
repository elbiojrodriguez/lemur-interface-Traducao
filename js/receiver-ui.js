import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();

  // 🔒 ID fixo disfarçado de aleatório
  const fakeRandomUUID = (fixedValue) => ({
    substr: (start, length) => fixedValue.substr(start, length)
  });
  const myId = fakeRandomUUID("elbiojorge").substr(0, 8); // Resultado: "elbiojor"

  let localStream = null;

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Gera QR Code com link para caller
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
      // 🔇 Silencia áudio recebido
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // 🔥 Oculta o QR Code (sem alterar mais nada)
      const qrElement = document.getElementById('qrcode');
      if (qrElement) qrElement.style.display = 'none';

      // Exibe vídeo remoto no PIP
      localVideo.srcObject = remoteStream;
    });
  };
};
