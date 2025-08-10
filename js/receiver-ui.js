import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // 1. Geração do QR Code
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // 2. Configuração do Chat Visual (sem funcionalidade ainda)
  const chatBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.className = 'text-display-placeholder';
  textDisplay.textContent = 'Escaneie o QR Code para iniciar';
  chatBox.appendChild(textDisplay);

  // 3. WebRTC Completo (com transmissão da câmera do Receiver)
  let localStream = null;

  // Solicita permissão da câmera mas NÃO exibe localmente
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro na câmera:", error);
      textDisplay.textContent = 'Erro: câmera não acessível';
    });

  // 4. Configuração do Teclado (input manual)
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.placeholder = 'Digite sua mensagem...';
  messageInput.style.width = '100%';
  messageInput.style.marginTop = '10px';
  chatBox.appendChild(messageInput);

  rtcCore.initialize(myId);
  
  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Câmera do Receiver não disponível");
      textDisplay.textContent = 'Erro: câmera necessária';
      return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // PIP do Caller
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
      remoteVideo.style.display = 'block';
      
      // Controle do QR Code
      document.getElementById('qrcode').style.display = 'none';
      
      // Atualização do Chat
      textDisplay.textContent = 'Conectado';
      messageInput.focus(); // Ativa o teclado automaticamente
    });
  };
};
