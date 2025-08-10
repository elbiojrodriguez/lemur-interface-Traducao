import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  // 1. Gera QR Code (primeira ação)
  const myId = crypto.randomUUID().substr(0, 8);
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 2. Configura chat visual (sem funcionalidades)
  const textDisplay = document.querySelector('.text-display-placeholder');

  // 3. WebRTC (sem acesso à câmera local)
  const rtcCore = new WebRTCCore();
  rtcCore.initialize(myId);
  
  rtcCore.onIncomingCall = (offer) => {
    // Usa null no lugar de localStream (nenhum vídeo local)
    rtcCore.handleIncomingCall(offer, null, (remoteStream) => {
      // Exibe vídeo do Caller no PIP
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';
      
      // Silencia áudio (garantia extra)
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);
      
      // Oculta QR Code após conexão
      document.getElementById('qrcode').style.display = 'none';
      
      // Atualiza status do chat
      textDisplay.textContent = 'Conectado | Digite sua mensagem';
    });
  };
};
