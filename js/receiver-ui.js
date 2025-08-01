import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = async () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('peerId').textContent = myId;
  
  // Generate full URL for caller with ID as parameter
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);
  
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const statusDisplay = document.getElementById('callStatus');
  let localStream = null;
  
  // Setup copy URL button
  document.getElementById('copyBtn').onclick = () => {
    navigator.clipboard.writeText(callerUrl)
      .then(() => statusDisplay.textContent = 'URL copiada!')
      .catch(err => {
        console.error('Falha ao copiar URL:', err);
        statusDisplay.textContent = 'Erro ao copiar URL';
      });
  };

  // Handle incoming calls
  rtcCore.onIncomingCall = async (offer) => {
    try {
      statusDisplay.textContent = 'Chamada recebida...';
      
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        localVideo.srcObject = localStream;
      }
      
      rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
        statusDisplay.textContent = 'Chamada conectada';
      });
      
    } catch (error) {
      console.error('Erro ao atender chamada:', error);
      statusDisplay.textContent = 'Erro ao atender chamada';
    }
  };

  // Handle call end
  rtcCore.setOnCallEndCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    localVideo.srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;
    statusDisplay.textContent = 'Chamada encerrada';
  });
};
