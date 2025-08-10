import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  // 1. Geração do QR Code
  const myId = crypto.randomUUID().substring(0, 8);
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 2. Configuração do Chat
  const textDisplay = document.querySelector('.text-display-placeholder');
  
  // 3. WebRTC (SEM acesso à câmera local)
  const rtcCore = new WebRTCCore();
  rtcCore.initialize(myId);
  
  rtcCore.onIncomingCall = (offer) => {
    rtcCore.handleIncomingCall(offer, null, (remoteStream) => { // null = sem stream local
      const remoteVideo = document.getElementById('remoteVideo');
      
      // Configurações à prova de falhas
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';
      remoteVideo.muted = true; // Silencia mesmo sem áudio
      
      // Desativa qualquer track de áudio
      remoteStream.getAudioTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      
      // Oculta QR Code
      document.getElementById('qrcode').style.display = 'none';
      
      // Atualiza chat
      textDisplay.textContent = 'Conectado | Digite sua mensagem';
      
      // Bloqueio extra para Safari iOS
      if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        remoteVideo.setAttribute('playsinline', 'true');
        remoteVideo.setAttribute('webkit-playsinline', 'true');
      }
    });
  };
};
