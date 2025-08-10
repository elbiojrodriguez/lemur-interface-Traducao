import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // 1. Geração do QR Code (original do receiver-1)
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 2. Chat Visual (adaptado do receiver-2)
  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.className = 'text-display-placeholder';
  textDisplay.textContent = 'Escaneie o QR Code para iniciar';
  chatBox.appendChild(textDisplay);

  // 3. Controle de Câmera (original do receiver-1)
  let localStream = null;
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      // Encerra preview local (regra do projeto)
      stream.getTracks().forEach(track => track.stop());
    })
    .catch(error => {
      console.error("Erro câmera:", error);
      textDisplay.textContent = 'Câmera não disponível';
    });

  // 4. WebRTC Completo (fusão das versões)
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers(); // Original do receiver-1

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Câmera não disponível");
      textDisplay.textContent = 'Erro: ative a câmera';
      return;
    }

    // Debug (do receiver-2)
    console.log('Chamada recebida:', offer.type);

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // PIP (original do receiver-1)
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';

      // Silencia áudio (ambas versões)
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // Controle QR Code (original do receiver-1)
      document.getElementById('qrcode').style.display = 'none';

      // Chat (adaptado do receiver-2)
      textDisplay.textContent = 'Conectado | Digite abaixo';
      
      // Input manual (novo)
      const messageInput = document.createElement('input');
      messageInput.type = 'text';
      messageInput.placeholder = 'Escreva sua mensagem...';
      messageInput.style.width = '100%';
      chatBox.appendChild(messageInput);
      messageInput.focus();
    });
  };
};
