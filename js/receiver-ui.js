import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;
  const localVideo = document.getElementById('localVideo');

  // 1. Solicitação de permissão da câmera (modificado)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      // Mostra a própria câmera em PIP (opcional)
      localVideo.srcObject = stream;
      localVideo.style.display = 'block'; // ← Remove se não quiser auto-visualização
    })
    .catch(error => {
      console.error("Erro na câmera:", error);
    });

  // 2. Geração do QR Code (inalterado)
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 3. Configuração WebRTC (crítica)
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Câmera do Receiver não disponível");
      return;
    }

    // Debug: verifica se o stream local tem tracks de vídeo
    console.log("Tracks da câmera local:", localStream.getVideoTracks().length);

    // 4. Handler corrigido (transmite localStream para o Caller)
    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // Configuração do vídeo recebido (Caller -> Receiver)
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';

      // Silencia áudio
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // Oculta QR Code
      document.getElementById('qrcode').style.display = 'none';
    });
  };
};
