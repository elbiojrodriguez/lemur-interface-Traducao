import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore('https://lemur-signal.onrender.com');
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').innerHTML = `Seu ID: <strong>${myId}</strong>`;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');

  // Opcional: Esconder remoteVideo se não for usado
  remoteVideo.style.display = 'none';

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
        // Não exibe o stream local (seu vídeo) no localVideo
        // Em vez disso, o localVideo vai mostrar o stream remoto
        // Se quiser exibir seu vídeo em outro lugar, use remoteVideo
        remoteVideo.srcObject = stream; // (Opcional, se quiser ver seu próprio vídeo em remoteVideo)

        rtcCore.handleIncomingCall(offer, stream, (remoteStream) => {
          // Exibe o vídeo do visitante (remoto) no localVideo (PIP)
          localVideo.srcObject = remoteStream;
        });

        btn.disabled = true;
      }).catch(err => {
        console.error('Erro ao acessar câmera:', err);
      });
    };
  };

  rtcCore.setRemoteStreamCallback(stream => {
    // Sempre que chegar um stream remoto, ele vai para o localVideo
    localVideo.srcObject = stream;
  });
};
