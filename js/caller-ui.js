import WebRTCCore from '../core/webrtc-core.js';

window.onload = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera e microfone:", error);
  }

  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;
  let targetId = null;

  document.getElementById('myId').textContent = myId;

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

  async function translateText(text, targetLang) {
    try {
      if (targetLang === 'en') return text;

      const response = await fetch(TRANSLATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });

      const result = await response.json();
      return result.translatedText || text;
    } catch (error) {
      console.error('Erro na tradução:', error);
      return text;
    }
  }

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');

  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';

    document.getElementById('callActionBtn').onclick = () => {
      if (localStream) {
        rtcCore.startCall(targetId, localStream);
      }
    };
  }

  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
