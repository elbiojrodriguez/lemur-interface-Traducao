import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  let localStream = null;
  let nome = "";
  let sobrenome = "";

  // 1️⃣ Solicita acesso à câmera e microfone
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;

      // 2️⃣ Captura nome e sobrenome dos campos já existentes
      const nomeInput = document.getElementById("nome");
      const sobrenomeInput = document.getElementById("sobrenome");

      if (!nomeInput || !sobrenomeInput) {
        console.warn("Campos de nome e sobrenome não encontrados no HTML.");
        return;
      }

      // 3️⃣ Detecta idioma automaticamente
      const idioma = navigator.language || navigator.userLanguage;

      // 4️⃣ Gera QR Code quando o usuário foca no campo sobrenome
      sobrenomeInput.addEventListener("focus", () => {
        nome = nomeInput.value.trim();
        sobrenome = sobrenomeInput.value.trim();

        if (nome !== "") {
          const nomeCompleto = `${nome} ${sobrenome}`.trim();
          const id = crypto.randomUUID().substr(0, 8);
          const url = `${window.location.origin}/caller.html?targetId=${id}&lang=${encodeURIComponent(idioma)}&nome=${encodeURIComponent(nomeCompleto)}`;

          QRCodeGenerator.generate("qrcode", url);

          // Continua com a lógica WebRTC
          rtcCore.initialize(id);
          rtcCore.setupSocketHandlers();

          const localVideo = document.getElementById('localVideo');
          localVideo.srcObject = localStream;

          rtcCore.onIncomingCall = (offer) => {
            if (!localStream) {
              console.warn("Stream local não disponível");
              return;
            }

            rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
              remoteStream.getAudioTracks().forEach(track => track.enabled = false);

              const qrElement = document.getElementById('qrcode');
              if (qrElement) qrElement.style.display = 'none';

              localVideo.srcObject = remoteStream;
            });
          };
        } else {
          alert("Por favor, digite seu nome.");
        }
      });
    })
    .catch(error => {
      console.error("Permissão negada ou erro ao acessar câmera/microfone:", error);
      alert("É necessário permitir acesso à câmera e microfone para continuar.");
    });
};
