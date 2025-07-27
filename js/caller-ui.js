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
