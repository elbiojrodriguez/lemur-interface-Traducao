import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;
  let qrCodeGenerated = false;

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Função para gerar o QR Code com todas as informações
  const generateQRCode = () => {
    if (qrCodeGenerated) return;

    const nameInput = document.getElementById('name-input');
    const userName = nameInput ? nameInput.value.trim() : 'Anonymous';

    // Usa o idioma completo com região, como pt-BR, en-US, etc.
    const browserLang = navigator.language || 'en';

    // URL com todos os parâmetros necessários
    const callerUrl = `https://lemur-interface-traducao.netlify.app/caller.html?targetId=${myId}&lang=${encodeURIComponent(browserLang)}&name=${encodeURIComponent(userName)}`;

    QRCodeGenerator.generate("qrcode", callerUrl);
    qrCodeGenerated = true;
  };

  // Gera o QR Code quando o usuário clica em "Next"
  const nextButton = document.getElementById('next-button');
  if (nextButton) {
    nextButton.addEventListener('click', generateQRCode);
  }

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

      // Oculta o QR Code
      const qrElement = document.getElementById('qrcode');
      if (qrElement) qrElement.style.display = 'none';

      // Exibe vídeo remoto
      localVideo.srcObject = remoteStream;
    });
  };
};
