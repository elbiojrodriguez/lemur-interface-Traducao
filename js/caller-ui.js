import WebRTCCore from '../core/webrtc-core.js';
import { SIGNALING_SERVER_URL } from '../core/internet-config.js';

window.onload = () => {
  const rtcCore = new WebRTCCore(SIGNALING_SERVER_URL);
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');

  // Aplica estilos para inverter as posições dos vídeos
  localVideo.style.position = 'absolute';
  localVideo.style.width = '100%';
  localVideo.style.height = '100%';
  localVideo.style.objectFit = 'cover';
  localVideo.style.zIndex = '1'; // Fundo

  remoteVideo.style.position = 'absolute';
  remoteVideo.style.width = '30%';
  remoteVideo.style.height = '30%';
  remoteVideo.style.bottom = '20px';
  remoteVideo.style.right = '20px';
  remoteVideo.style.border = '2px solid white';
  remoteVideo.style.borderRadius = '8px';
  remoteVideo.style.zIndex = '2'; // Sobreposição (PIP)

  document.getElementById('offBtn').onclick = () => window.close();

  navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'user' }, 
    audio: true 
  }).then(stream => {
    localVideo.srcObject = stream;

    document.getElementById('callActionBtn').onclick = () => {
      const targetId = prompt('Digite o ID do destinatário');
      if (targetId) {
        rtcCore.startCall(targetId.trim(), stream);
      }
    };
  }).catch(err => {
    console.error('Erro ao acessar câmera:', err);
  });

  rtcCore.setRemoteStreamCallback(stream => {
    remoteVideo.srcObject = stream;
  });
};
