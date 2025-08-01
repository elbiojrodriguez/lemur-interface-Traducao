import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeScanner } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = null;
  let localStream = null;

  // Check for ID in URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Setup QR Code scanner
  document.getElementById('scanBtn').onclick = async () => {
    try {
      await QRCodeScanner.start('reader', (decodedUrl) => {
        try {
          const url = new URL(decodedUrl);
          if (url.pathname.endsWith('/caller.html')) {
            targetId = url.searchParams.get('targetId');
            if (targetId) {
              document.getElementById('callActionBtn').style.display = 'block';
              document.getElementById('qrStatus').textContent = 'QR Code válido!';
            }
          }
        } catch (e) {
          console.error("QR Code inválido:", e);
          document.getElementById('qrStatus').textContent = 'QR Code inválido';
        }
      });
    } catch (error) {
      console.error("Erro ao iniciar scanner:", error);
      document.getElementById('qrStatus').textContent = 'Erro ao acessar câmera';
    }
  };

  // Setup call button
  document.getElementById('callActionBtn').onclick = async () => {
    if (!targetId) return;
    
    try {
      document.getElementById('callStatus').textContent = 'Conectando...';
      localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localVideo.srcObject = localStream;
      remoteVideo.srcObject = null; // Clear previous stream
      
      rtcCore.startCall(targetId, localStream);
      document.getElementById('callStatus').textContent = 'Chamando...';
    } catch (error) {
      console.error("Erro ao iniciar chamada:", error);
      document.getElementById('callStatus').textContent = 'Erro ao conectar';
    }
  };

  // Handle incoming remote stream
  rtcCore.setRemoteStreamCallback(stream => {
    remoteVideo.srcObject = stream;
    document.getElementById('callStatus').textContent = 'Conectado';
  });

  // Handle call end
  rtcCore.setOnCallEndCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    document.getElementById('callStatus').textContent = 'Chamada encerrada';
  });
};
