import WebRTCCore from '../core/webrtc-core.js';

window.onload = async () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  // 1. Inicialização básica
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();
  
  // 2. Verifica parâmetro na URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('targetId');

  if (targetId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      document.getElementById('remoteVideo').srcObject = stream;
      rtcCore.startCall(targetId, stream);
      
      // Configura callback para vídeo remoto
      rtcCore.setRemoteStreamCallback(remoteStream => {
        document.getElementById('localVideo').srcObject = remoteStream;
      });
      
    } catch (error) {
      console.error('Erro ao acessar mídia:', error);
      // Adicione aqui tratamento visual de erro se necessário
    }
  }
};
