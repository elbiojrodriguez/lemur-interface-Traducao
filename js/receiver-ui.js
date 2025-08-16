import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // 🔒 Request camera and microphone access
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;

      // 🔧 Initialize WebRTC (kept as is)
      rtcCore.initialize(myId);
      rtcCore.setupSocketHandlers();

      const localVideo = document.getElementById('localVideo');

      rtcCore.onIncomingCall = (offer) => {
        if (!localStream) {
          console.warn("Local stream not available");
          return;
        }

        rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
          remoteStream.getAudioTracks().forEach(track => track.enabled = false);

          const qrElement = document.getElementById('qrcode');
          if (qrElement) qrElement.style.display = 'none';

          localVideo.srcObject = remoteStream;
        });
      };

      // 🎯 Requested change: QR Code generated ONLY here (with all data)
      const nomeInput = document.getElementById("nome");
      const sobrenomeInput = document.getElementById("sobrenome");

      if (!nomeInput || !sobrenomeInput) return;

      const idioma = navigator.language || navigator.userLanguage;

      sobrenomeInput.addEventListener("focus", () => {
        const nome = nomeInput.value.trim();
        const sobrenome = sobrenomeInput.value.trim();

        if (nome !== "") {
          const nomeCompleto = `${nome} ${sobrenome}`.trim();
          const url = `${window.location.origin}/caller.html?targetId=${myId}&lang=${encodeURIComponent(idioma)}&nome=${encodeURIComponent(nomeCompleto)}`;
          QRCodeGenerator.generate("qrcode", url); // Single QR Code generation
        } else {
          alert("Please enter your name.");
        }
      });
    })
    .catch(error => {
      console.error("Permission denied or camera/microphone access error:", error);
      alert("Camera and microphone access is required to continue.");
    });
};
