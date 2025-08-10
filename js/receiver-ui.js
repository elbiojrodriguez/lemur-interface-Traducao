import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // 1. Geração do QR Code (mantido do receiver-1)
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 2. Configuração do Chat Visual (novo do receiver-2)
  const textDisplay = document.createElement('div');
  textDisplay.className = 'text-display-placeholder';
  textDisplay.textContent = 'Escaneie o QR Code para iniciar';
  document.querySelector('.chat-input-box').appendChild(textDisplay);

  // 3. WebRTC Híbrido (fusão das duas versões)
  let localStream = null; // Mantido do receiver-1

  // Acesso à câmera (do receiver-1, mas sem usar o stream local)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      // Encerra as tracks imediatamente (não será usado)
      stream.getTracks().forEach(track => track.stop());
    })
    .catch(error => {
      console.error("Aviso: Câmera não acessada", error); // Apenas log, não bloqueante
    });

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // Handler de Chamada Aprimorado (fusão)
  rtcCore.onIncomingCall = (offer) => {
    console.log('Chamada recebida - Debug:', offer.type); // Novo do receiver-2

    // Usa null no lugar de localStream (do receiver-2)
    rtcCore.handleIncomingCall(offer, null, (remoteStream) => {
      // PIP e Áudio (ambas versões)
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // Controle do QR Code (do receiver-1)
      document.getElementById('qrcode').style.display = 'none';

      // Atualização do Chat (novo do receiver-2)
      textDisplay.textContent = 'Conectado | Digite sua mensagem';
    });
  };
};
