import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // ====================
  // 1. GERAR QR CODE (PRIMEIRO PASSO)
  // ====================
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);
  document.getElementById('qrcode').style.display = 'block'; // Garante visibilidade

  // ====================
  // 2. CONFIGURAÇÃO DO CHAT
  // ====================
  const chatInputBox = document.querySelector('.chat-input-box');
  const textDisplay = document.createElement('div');
  textDisplay.className = 'text-display-placeholder';
  textDisplay.style.padding = '10px';
  textDisplay.style.color = 'black';
  textDisplay.style.textAlign = 'center';
  textDisplay.style.height = '100%';
  textDisplay.style.display = 'flex';
  textDisplay.style.alignItems = 'center';
  textDisplay.style.justifyContent = 'center';
  textDisplay.style.wordBreak = 'break-word';
  textDisplay.style.overflowY = 'auto';
  chatInputBox.appendChild(textDisplay);
  textDisplay.textContent = 'Aguardando conexão...';

  // ====================
  // 3. WEBCAM E WEBRTC
  // ====================
  let localStream = null;

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Stream local não disponível");
      return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // Silencia áudio recebido
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // Oculta o QR Code quando a chamada começar
      document.getElementById('qrcode').style.display = 'none';

      // Exibe vídeo remoto no PIP
      localVideo.srcObject = remoteStream;
      localVideo.style.display = 'block'; // Mostra o PIP
      
      // Atualiza status do chat
      textDisplay.textContent = 'Conectado - Digite sua mensagem';
    });
  };
};
