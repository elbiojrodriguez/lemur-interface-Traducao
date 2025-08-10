import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Gera QR Code com link para caller
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Stream local não disponível");
      return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // 🔇 Silencia áudio recebido
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // 🔥 Oculta o QR Code (sem alterar mais nada)
      const qrElement = document.getElementById('qrcode');
      if (qrElement) qrElement.style.display = 'none';

      // Exibe vídeo remoto no PIP
      localVideo.srcObject = remoteStream;
    });
  };
};
js/qr-code-utils.js
// /js/qr-code-utils.js
export class QRCodeGenerator {
  static generate(containerId, text, size = 150) {
    return new QRCode(document.getElementById(containerId), {
      text,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
    });
  }
}

export class QRCodeScanner {
  static start(containerId, onScan) {
    const qrScanner = new Html5QrcodeScanner(containerId, { 
      fps: 10, 
      qrbox: 250 
    });
    qrScanner.render(onScan);
    return qrScanner; // Para controle externo se necessário
  }
// ▼▼▼ ADICIONE ISSO ▼▼▼ (Configuração básica do chat)
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

// Mensagem inicial (opcional)
textDisplay.textContent = 'Chat pronto para uso'; // Você pode mudar esse texto
// ▲▲▲ FIM DO CÓDIGO A ADICIONAR ▲▲▲
}
});
