import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();

  // 🔒 Captura o ID vindo da URL (ex: receiver.html?yz456)
  const url = window.location.href;
  const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);

  // 🔁 Simula crypto.randomUUID() com valor fixo
  function fakeRandomUUID(fixedValue) {
    return {
      substr: function(start, length) {
        return fixedValue.substr(start, length);
      }
    };
  }

  const myId = fakeRandomUUID(fixedId).substr(0, 8); // ← ID vindo do Flutter

  let localStream = null;

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

 // 🔗 Captura os parâmetros reais da URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';
const lang = params.get('lang') || '';

// 📦 Monta a URL final que será usada no QR Code
const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;

// 🧾 Gera o QR Code com essa URL
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
  // 🔇 Desativa o áudio do stream remoto
  remoteStream.getAudioTracks().forEach(track => track.enabled = false);

  // 🧾 Oculta o bloco do QR Code após conexão
  const overlay = document.querySelector('.info-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }

  // 🎥 Exibe o vídeo remoto na tela
  localVideo.srcObject = remoteStream;
});
    });
  };
};
