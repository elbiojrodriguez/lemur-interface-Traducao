import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  // 1. Geração do QR Code (existente)
  const myId = crypto.randomUUID().substr(0, 8);
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 2. Chat Visual (existente)
  const textDisplay = document.querySelector('.text-display-placeholder');

  // 3. WebRTC - Recebimento Otimizado (nova implementação)
  const rtcCore = new WebRTCCore();
  rtcCore.initialize(myId);

  // Handler de Chamada (compatível com o Caller existente)
  rtcCore.onIncomingCall = (offer) => {
    // Debug: verifica se a offer chegou completa
    console.log('Offer recebida:', offer.type, offer.sdp?.substring(0, 50) + '...');

    rtcCore.handleIncomingCall(offer, null, (remoteStream) => {
      // Exibição do Vídeo (PIP)
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';

      // Silencia áudio (sem alterar outras funcionalidades)
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // Atualização do Chat (existente)
      textDisplay.textContent = 'Conectado | Digite sua mensagem';

      // Oculta QR Code (existente)
      document.getElementById('qrcode').style.display = 'none';
    });
  };

  // 4. Mantém Todas as Outras Funcionalidades Originais
  // - Nenhuma outra modificação necessária
};
