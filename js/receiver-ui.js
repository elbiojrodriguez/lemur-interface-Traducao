import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // 1️⃣ Solicita acesso à câmera e microfone
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;

      // 2️⃣ Aguarda preenchimento do nome
      const nomeInput = document.createElement("input");
      nomeInput.setAttribute("id", "nome");
      nomeInput.setAttribute("placeholder", "Digite seu nome");
      nomeInput.setAttribute("type", "text");
      nomeInput.setAttribute("required", true);

      const sobrenomeInput = document.createElement("input");
      sobrenomeInput.setAttribute("id", "sobrenome");
      sobrenomeInput.setAttribute("placeholder", "Sobrenome (opcional)");
      sobrenomeInput.setAttribute("type", "text");

      const container = document.querySelector(".info-overlay");
      container.appendChild(nomeInput);
      container.appendChild(sobrenomeInput);

      // 3️⃣ Detecta idioma automaticamente
      const idioma = navigator.language || navigator.userLanguage;

      // 4️⃣ Gera QR Code quando o usuário foca no sobrenome
      sobrenomeInput.addEventListener("focus", () => {
        const nome = nomeInput.value.trim();
        const sobrenome = sobrenomeInput.value.trim();

        if (nome !== "") {
          const nomeCompleto = `${nome} ${sobrenome}`.trim();
          const url = `${window.location.origin}/caller.html?targetId=${myId}&lang=${encodeURIComponent(idioma)}&nome=${encodeURIComponent(nomeCompleto)}`;

          QRCodeGenerator.generate("qrcode", url);
        } else {
          alert("Por favor, digite seu nome.");
        }
      });

      // Continua com a lógica WebRTC
      rtcCore.initialize(myId);
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
    })
    .catch(error => {
      console.error("Permissão negada ou erro ao acessar câmera/microfone:", error);
      alert("É necessário permitir acesso à câmera e microfone para continuar.");
    });
};
