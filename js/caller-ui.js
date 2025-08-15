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

  // 🌐 Idiomas disponíveis (com "Eu sou" e "Eu falo" traduzidos)
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

  // 📥 Captura parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdFromUrl = urlParams.get('targetId');
  const userNameFromUrl = urlParams.get('nome');
  const userLangFromUrl = urlParams.get('lang');

  // 🌍 Detecta idioma (prioridade: URL > navegador > padrão)
  const detectedLanguage = userLangFromUrl || navigator.language || 'pt-BR';
  const selectedLanguage = languages.find(l => l.code === detectedLanguage) || 
                         languages.find(l => l.code.startsWith(detectedLanguage.split('-')[0])) || 
                         languages[1];

  // ✨ Exibe "Eu sou [nome]" se vier da URL
  if (userNameFromUrl) {
    const greetingElement = document.getElementById('userGreeting');
    if (greetingElement) {
      greetingElement.textContent = `${selectedLanguage.greetingText} ${decodeURIComponent(userNameFromUrl)}`;
    }
  }

  // 🏳️ Exibe "Eu falo [bandeira]"
  const languageInfoElement = document.getElementById('languageInfo');
  if (languageInfoElement) {
    languageInfoElement.textContent = `${selectedLanguage.speakText} ${selectedLanguage.flag}`;
  }

  // Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Configura targetId se vier da URL
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // 🔄 Novo: Configura botão para enviar nome + idioma do caller
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;

    const nome = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();

    if (!nome) {
      alert("Por favor, digite seu nome.");
      return;
    }

    // 🚀 Envia dados completos ao servidor
    rtcCore.startCall(targetId, localStream, {
      senderName: `${nome} ${sobrenome}`.trim(),
      senderLanguage: detectedLanguage
    });
  };

  // Silencia qualquer áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
