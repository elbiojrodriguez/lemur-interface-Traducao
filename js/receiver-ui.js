import WebRTCCore from '../core/webrtc-core.js';
import { SIGNALING_SERVER_URL } from '../core/internet-config.js';

window.onload = () => {
  const rtcCore = new WebRTCCore(SIGNALING_SERVER_URL);
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').innerHTML = `Seu ID: <strong>${myId}</strong>`;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');

  document.getElementById('offBtn').onclick = () => window.close();

  rtcCore.onIncomingCall = (offer) => {
    const btn = document.getElementById('callActionBtn');
    btn.textContent = 'Join';
    btn.style.display = 'block';
    btn.disabled = false;

    btn.onclick = () => {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      }).then(stream => {
        localVideo.srcObject = stream;

        rtcCore.handleIncomingCall(offer, stream, (remoteStream) => {
          remoteVideo.srcObject = remoteStream;
        });

        btn.disabled = true;
      }).catch(err => {
        console.error('Erro ao acessar câmera:', err);
      });
    };
  };

  rtcCore.setRemoteStreamCallback(stream => {
    remoteVideo.srcObject = stream;
  });
};
