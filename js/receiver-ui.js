// /js/receiver-ui.js
import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // Substitui o texto pelo QR Code
  QRCodeGenerator.generate("qrcode", myId);
  
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  
  rtcCore.onIncomingCall = (offer) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localVideo.srcObject = stream;
        rtcCore.handleIncomingCall(offer, stream, (remoteStream) => {
          localVideo.srcObject = remoteStream;
        });
      });
  };
};
