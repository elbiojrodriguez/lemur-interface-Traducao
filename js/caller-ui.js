window.onload = async () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers(); // LINHA ADICIONADA
  
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('targetId');

  if (targetId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // CORREÇÃO DOS VÍDEOS:
      document.getElementById('localVideo').srcObject = stream; // Alterado para local
      rtcCore.startCall(targetId, stream);
      
      rtcCore.setRemoteStreamCallback(remoteStream => {
        document.getElementById('remoteVideo').srcObject = remoteStream; // Alterado para remote
      });
      
    } catch (error) {
      console.error('Erro:', error);
    }
  }
};
