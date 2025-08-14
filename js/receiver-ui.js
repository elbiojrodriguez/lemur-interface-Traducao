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

  // 🧑 Captura nome e sobrenome para incluir no QR code
  const nomeInput = document.getElementById('nome');
  const sobrenomeInput = document.getElementById('sobrenome');

  // Aguarda pequeno tempo para garantir que os inputs estejam disponíveis
  setTimeout(() => {
    const nome = nomeInput?.value.trim() || "Anônimo";
    const sobrenome = sobrenomeInput?.value.trim() || "";

    const identidade = `Eu sou ${nome} ${sobrenome} e falo 🇧🇷`;
    const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&identidade=${encodeURIComponent(identidade)}`;

    // Gera QR Code com a frase personalizada
    QRCodeGenerator.generate("qrcode", callerUrl);
  }, 500);

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
