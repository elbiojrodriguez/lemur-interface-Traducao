import WebRTCCore from '../core/webrtc-core.js';

window.onload = () => {
  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = null;
  let localStream = null;

  // ✨ Get name from URL
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('nome');
  
  // Show personalized greeting if name exists
  if (userName) {
    const greetingElement = document.getElementById('userGreeting');
    if (greetingElement) {
      greetingElement.textContent = `I am ${decodeURIComponent(userName)}`;
    }
  }

  // Request camera access on page load
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Camera access error:", error);
    });

  // Check for target ID in URL
  const targetIdFromUrl = urlParams.get('targetId');

  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Configure call button
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // Mute any received audio
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });

  // 🌐 Available languages with translated "I speak" and "I am"
  const languages = [
    {code:'en-US',flag:'🇺🇸',speakText:'I speak',greetingText:'I am',name:'English'},
    {code:'pt-BR',flag:'🇧🇷',speakText:'Eu falo',greetingText:'Eu sou',name:'Português'},
    {code:'es-ES',flag:'🇪🇸',speakText:'Yo hablo',greetingText:'Yo soy',name:'Español'},
    {code:'fr-FR',flag:'🇫🇷',speakText:'Je parle',greetingText:'Je suis',name:'Français'},
    {code:'de-DE',flag:'🇩🇪',speakText:'Ich spreche',greetingText:'Ich bin',name:'Deutsch'},
    {code:'ja-JP',flag:'🇯🇵',speakText:'私は話します',greetingText:'私は',name:'日本語'},
    {code:'zh-CN',flag:'🇨🇳',speakText:'我说',greetingText:'我是',name:'中文'},
    {code:'ru-RU',flag:'🇷🇺',speakText:'Я говорю',greetingText:'Я',name:'Русский'},
    {code:'ar-SA',flag:'🇸🇦',speakText:'أنا أتكلم',greetingText:'أنا',name:'العربية'}
  ];

  // 📥 Detect language (URL > browser > default)
  const lang = urlParams.get('lang') || navigator.language || 'pt-BR';

  // 🔍 Find matching language (with smart fallback)
  const selectedLang = languages.find(l => l.code === lang) || 
                      languages.find(l => l.code.startsWith(lang.split('-')[0])) || // Ex: "es" for "es-ES"
                      languages[1]; // Fallback to pt-BR

  // 🖼️ Show translated phrases
  const languageInfoElement = document.getElementById('languageInfo');
  if (languageInfoElement) {
    languageInfoElement.textContent = `${selectedLang.speakText} ${selectedLang.flag}`;
  }

  // ✨ Show "I am [name]" in correct language (if name exists)
  if (userName) {
    const greetingElement = document.getElementById('userGreeting');
    if (greetingElement) {
      greetingElement.textContent = `${selectedLang.greetingText} ${decodeURIComponent(userName)}`;
    }
  }
};
