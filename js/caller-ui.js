import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const rtcCore = new WebRTCCore('https://lemur-signal.onrender.com');
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const pipContainer = document.querySelector('.local-pip');

  // O botão "Off" agora tem ícone de microfone mas mantém a mesma função
  document.getElementById('offBtn').onclick = () => window.close();

  navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'user' }, 
    audio: true 
  }).then(stream => {
    localVideo.srcObject = stream;
    localVideo.style.display = 'none';

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
    const pipVideo = pipContainer.querySelector('video') || document.createElement('video');
    pipVideo.srcObject = stream;
    pipVideo.autoplay = true;
    pipVideo.playsinline = true;
    pipVideo.style.display = 'block';
    pipVideo.style.width = '100%';
    pipVideo.style.height = '100%';
    pipVideo.style.objectFit = 'cover';
    
    if (!pipContainer.contains(pipVideo)) {
      pipContainer.innerHTML = '';
      pipContainer.appendChild(pipVideo);
    }
  });
};
