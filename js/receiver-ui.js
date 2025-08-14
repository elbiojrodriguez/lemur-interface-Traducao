import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // 🔒 Solicita acesso à câmera e microfone
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;

      // 🔗 Gera QR Code com link simples (mantido como estava)
      const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
      QRCodeGenerator.generate("qrcode", callerUrl);

      // 🔧 Inicializa WebRTC (mantido como estava)
      rtcCore.initialize(myId);
      rtcCore.setupSocketHandlers();

      const localVideo = document.getElementById('localVideo');

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

      // 🧩 Lógica adicional do plano (sem interferir no original)
      const nomeInput = document.getElementById("nome");
      const sobrenomeInput = document.getElementById("sobrenome");

      if (!nomeInput || !sobrenomeInput) return;

      const idioma = navigator.language || navigator.userLanguage;

      sobrenomeInput.addEventListener("focus", () => {
        const nome = nomeInput.value.trim();
        const sobrenome = sobrenomeInput.value.trim();

        if (nome !== "") {
          const nomeCompleto = `${nome} ${sobrenome}`.trim();
          const id = crypto.randomUUID().substr(0, 8);
          const url = `${window.location.origin}/caller.html?targetId=${id}&lang=${encodeURIComponent(idioma)}&nome=${encodeURIComponent(nomeCompleto)}`;

          QRCodeGenerator.generate("qrcode", url);
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
