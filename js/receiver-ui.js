import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  // 1. GERAR QR CODE (sempre primeiro)
  const myId = crypto.randomUUID().substr(0, 8);
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 2. INICIAR CHAT (sem vídeo local)
  const textDisplay = document.querySelector('.text-display-placeholder');
  
  // 3. WEBCAM DO CALLER (PIP somente)
  const rtcCore = new WebRTCCore();
  rtcCore.initialize(myId);
  
  rtcCore.onIncomingCall = (offer) => {
    rtcCore.handleIncomingCall(offer, null, (remoteStream) => { // ← null = SEM stream local
      // Regra 1: Mostrar vídeo do Caller no PIP
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';
      
      // Regra 2: Silenciar áudio (mesmo sem áudio, garantia extra)
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);
      
      // Regra 3: Esconder QR Code após conexão
      document.getElementById('qrcode').style.display = 'none';
      
      // Atualizar chat
      textDisplay.textContent = 'Conectado | Digite sua mensagem';
    });
  };
};
