import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = async () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // 1. Geração do QR Code
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}`;
  QRCodeGenerator.generate("qrcode", callerUrl);
  
  // 2. Inicialização mínima necessária
  rtcCore.initialize(myId);
  
  try {
    // 3. Configuração automática da stream local
    const localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = localStream;
    
    // 4. Configuração do handler de chamadas (mantido da versão atual)
    rtcCore.onIncomingCall = (offer) => {
      rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        localVideo.srcObject = remoteStream; // Atualiza para stream remota
      });
    };
    
  } catch (error) {
    console.error('Erro ao acessar dispositivos:', error);
    // Adicione tratamento visual de erro aqui se necessário
  }
};
